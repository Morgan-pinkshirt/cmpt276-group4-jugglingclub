(function () {
    const state = {
        savedProducts: [],
        selectedProductId: '',
        moments: [],
        currentMoment: null,
        activePlayingMoment: null
    };

    const dom = {
        panel: document.getElementById('momentEditPanel'),
        btnTogglePanel: document.getElementById('btnTogglePanel'),
        btnExpandPanel: document.getElementById('btnExpandPanel'),

        momentTitleEdit: document.getElementById('momentEditTitleInput'),
        productSelect: document.getElementById('savedProductSelect'),
        btnRefresh: document.getElementById('btnRefreshProducts'),
        btnEditIn3D: document.getElementById('btnEditMomentIn3D'),
        btnApply: document.getElementById('btnApplyMomentBinding'),

        momentBadge: document.getElementById('activeMomentBadge'),
        panelMomentsCount: document.getElementById('panelMomentsCount'),
        momentListContainer: document.getElementById('momentListContainer'),
        liveState: document.getElementById('synchroLiveState'),
        simProductStatus: document.getElementById('simProductStatus')
    };

    // ---------- 3D stage = iframe view.html?embed=1 ----------
    const STAGE_URL = window.JESTER_3D_URL || 'view.html';
    const stage = {
        frame: document.getElementById('stageFrame'),
        ready: false,
        pending: null,
        lastKey: null
    };

    function sendToStage(options, force) {
        const win = stage.frame?.contentWindow;
        if (!win) return;
        const key = JSON.stringify(options || {});
        if (!force && key === stage.lastKey) return;
        stage.lastKey = key;
        win.postMessage({ type: 'applyMoment', options: options || {} }, window.location.origin);
    }

    window.applyMomentOptions = function (options) {
        stage.pending = options || {};
        if (stage.ready) sendToStage(stage.pending, false);
    };

    function markStageReady() {
        stage.ready = true;
        if (stage.pending) sendToStage(stage.pending, true);
    }

    if (stage.frame) {
        stage.frame.addEventListener('load', markStageReady);
        stage.frame.src = `${STAGE_URL}?embed=1`;
    }
    
    const editor = { overlay: null, frame: null, momentId: null, options: null };

    function closeMomentEditor() {
        editor.overlay?.remove();
        editor.overlay = null;
        editor.frame = null;
        editor.momentId = null;
        editor.options = null;
    }

    function openMomentEditor(moment) {
        if (!moment || !moment.id || editor.overlay) return;

        const overlay = document.createElement('div');
        overlay.className = 'design-modal';

        const box = document.createElement('div');
        box.className = 'design-modal-box';

        const head = document.createElement('div');
        head.className = 'design-modal-head';
        const title = document.createElement('span');
        title.textContent = `Edit design: ${moment.title || ''}`;
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 't-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', closeMomentEditor);
        head.append(title, closeBtn);

        const frame = document.createElement('iframe');
        frame.className = 'design-modal-frame';
        frame.title = '3D editor';
        frame.src = `${STAGE_URL}?embed=edit&moment=${encodeURIComponent(moment.id)}`;

        box.append(head, frame);
        overlay.append(box);
        document.body.append(overlay);

        editor.overlay = overlay;
        editor.frame = frame;
        editor.momentId = moment.id;
        editor.options = moment.options || {};
    }

    window.addEventListener('message', (e) => {
        if (e.origin !== window.location.origin) return;
        const msg = e.data;
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'stageReady') {
            if (e.source === stage.frame?.contentWindow) {
                markStageReady();
            } else if (editor.frame && e.source === editor.frame.contentWindow) {
                editor.frame.contentWindow.postMessage(
                    { type: 'applyMoment', options: editor.options || {} },
                    window.location.origin
                );
            }
            return;
        }

        if (msg.type === 'saveMoment') {
            if (!editor.frame || e.source !== editor.frame.contentWindow) return;
            if (!msg.momentId || msg.momentId !== editor.momentId) return;
            const id = editor.momentId;
            closeMomentEditor();
            const updated = window.MusicEditorAPI?.updateMoment?.(id, { options: msg.options || {} });
            if (updated) {
                state.currentMoment = updated;
                renderStage(`Saved design for "${updated.title}"`);
            }
        }
    });

    const STORAGE_KEYS = ['savingProducts', 'savedProducts', 'myProducts', 'products'];

    function setPanelCollapsed(collapsed) {
        if (!dom.panel || !dom.btnExpandPanel) return;
        dom.panel.classList.toggle('is-collapsed', collapsed);
        dom.btnExpandPanel.classList.toggle('is-hidden', !collapsed);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 210);
    }

    function loadProducts() {
        let list = [];
        for (const key of STORAGE_KEYS) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    list = parsed.map((p, i) => ({
                        id: String(p.id ?? p.name ?? `prod_${i}`),
                        name: p.name || p.title || `Product #${i + 1}`,
                        type: p.type || p.productType || 'club',
                        raw: p
                    }));
                    break;
                }
            } catch (_) { }
        }
        state.savedProducts = list;
        renderProductSelect();
        renderStage();
    }

    function renderProductSelect() {
        if (!dom.productSelect) return;
        const prev = state.selectedProductId;
        dom.productSelect.innerHTML = '<option value="">-- Saving Product --</option>';
        state.savedProducts.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.type})`;
            dom.productSelect.appendChild(opt);
        });
        if (state.savedProducts.some((p) => p.id === prev)) {
            dom.productSelect.value = prev;
        } else if (state.savedProducts.length) {
            state.selectedProductId = state.savedProducts[0].id;
            dom.productSelect.value = state.selectedProductId;
        }
    }

    function syncFormToMoment(m) {
        const hasMoment = Boolean(m);
        if (dom.momentTitleEdit) dom.momentTitleEdit.disabled = !hasMoment;
        if (dom.btnApply) dom.btnApply.disabled = !hasMoment;
        if (dom.btnEditIn3D) dom.btnEditIn3D.disabled = !hasMoment;

        if (!m) {
            if (dom.momentTitleEdit) dom.momentTitleEdit.value = '';
            return;
        }

        if (dom.momentTitleEdit) dom.momentTitleEdit.value = m.title || '';
        const prodId = m.synchro?.productId;
        if (prodId && dom.productSelect && state.savedProducts.some((p) => p.id === prodId)) {
            state.selectedProductId = prodId;
            dom.productSelect.value = prodId;
        }
    }

    function renderMomentList() {
        if (dom.panelMomentsCount) {
            dom.panelMomentsCount.textContent = String(state.moments.length);
        }
        if (!dom.momentListContainer) return;

        dom.momentListContainer.innerHTML = '';
        if (!state.moments.length) {
            dom.momentListContainer.innerHTML = '<div class="moment-list-empty">No moments created yet.</div>';
            return;
        }

        state.moments.forEach((m) => {
            const item = document.createElement('div');
            item.className = `moment-list-item ${m.id === state.currentMoment?.id ? 'is-selected' : ''}`;
            const titleEl = document.createElement('span');
            titleEl.textContent = m.title;
            const timeEl = document.createElement('span');
            timeEl.className = 'moment-list-item-time';
            timeEl.textContent = `${m.start}s–${m.end}s`;
            item.append(titleEl, timeEl);
            item.addEventListener('click', () => {
                window.MusicEditorAPI?.selectMoment?.(m.id);
            });
            dom.momentListContainer.appendChild(item);
        });
    }

    function applyToCurrentMoment() {
        if (!state.currentMoment || !window.MusicEditorAPI?.updateMoment) return;
        const updated = window.MusicEditorAPI.updateMoment(state.currentMoment.id, {
            title: dom.momentTitleEdit?.value,
            synchro: {
                ...(state.currentMoment.synchro || {}),
                productId: state.selectedProductId || null
            }
        });
        if (updated) {
            state.currentMoment = updated;
            renderStage(`Saved "${updated.title}"`);
        }
    }

    function renderStage(note) {
        const prod = state.savedProducts.find((p) => p.id === state.selectedProductId);
        const mom = state.activePlayingMoment || state.currentMoment;

        if (dom.simProductStatus) {
            if (mom?.options?.productType) {
                dom.simProductStatus.textContent = `3D Design: ${mom.options.productType} (${mom.options.effect || 'none'})`;
            } else if (prod) {
                dom.simProductStatus.textContent = `Product: ${prod.name} (${prod.type})`;
            } else {
                dom.simProductStatus.textContent = 'No Saving Product selected';
            }
        }

        if (!mom) {
            if (dom.momentBadge) dom.momentBadge.textContent = 'None';
            if (dom.liveState) dom.liveState.textContent = note || 'Waiting for music and moments...';
            return;
        }

        if (dom.momentBadge) dom.momentBadge.textContent = mom.title;

        const payload = {
            note: note || undefined,
            product: prod ? { id: prod.id, name: prod.name, type: prod.type } : null,
            moment: {
                id: mom.id,
                title: mom.title,
                start: mom.start,
                end: mom.end,
                options: mom.options || null
            }
        };

        if (dom.liveState) {
            dom.liveState.textContent = JSON.stringify(payload, null, 2);
        }
        window.dispatchEvent(new CustomEvent('synchro:momentDesign', { detail: payload }));
    }

    dom.btnTogglePanel?.addEventListener('click', () => setPanelCollapsed(true));
    dom.btnExpandPanel?.addEventListener('click', () => setPanelCollapsed(false));

    dom.productSelect?.addEventListener('change', (e) => {
        state.selectedProductId = e.target.value;
        renderStage();
    });

    dom.btnRefresh?.addEventListener('click', loadProducts);
    dom.btnApply?.addEventListener('click', applyToCurrentMoment);

    window.addEventListener('musicEditor:momentsUpdated', (e) => {
        state.moments = e.detail?.moments || [];
        if (state.currentMoment) {
            state.currentMoment = state.moments.find((m) => m.id === state.currentMoment.id) || null;
        }
        renderMomentList();
        renderStage();
    });

    window.addEventListener('musicEditor:momentSelected', (e) => {
        state.currentMoment = e.detail?.moment || null;
        if (!state.currentMoment) {
            state.activePlayingMoment = null;
        }
        syncFormToMoment(state.currentMoment);
        renderMomentList();
        renderStage();
    });

    window.addEventListener('musicEditor:momentEntered', (e) => {
        state.activePlayingMoment = e.detail?.moment || null;
        syncFormToMoment(state.activePlayingMoment);
        renderStage('Entered moment');
    });

    window.addEventListener('musicEditor:playbackTick', (e) => {
        const cur = e.detail?.currentTime ?? 0;
        const next = state.moments.find((m) => cur >= m.start && cur <= m.end) || null;
        if (next?.id !== state.activePlayingMoment?.id) {
            state.activePlayingMoment = next;
            renderStage();
        }
    });

    window.addEventListener('musicEditor:cleared', () => {
        state.moments = [];
        state.currentMoment = null;
        state.activePlayingMoment = null;
        syncFormToMoment(null);
        renderMomentList();
        renderStage('Cleared music and moments');
    });

    window.SynchroAPI = {
        openMomentEditor,
        setSavedProducts(list) {
            state.savedProducts = Array.isArray(list)
                ? list.map((p, i) => ({
                    id: String(p.id ?? p.name ?? `prod_${i}`),
                    name: p.name || p.title || `Product #${i + 1}`,
                    type: p.type || p.productType || 'club',
                    raw: p
                }))
                : [];
            renderProductSelect();
            renderStage();
        }
    };

    syncFormToMoment(null);
    loadProducts();
})();