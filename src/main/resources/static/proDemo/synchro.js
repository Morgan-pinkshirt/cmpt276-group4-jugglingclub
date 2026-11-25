(function () {
    const state = {
        savedProducts: [],
        selectedProductId: '',
        pendingProductId: null,
        pendingMomentId: null,
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
        btnChooseProduct: document.getElementById('btnChooseSavedProduct'),
        savedProductLabel: document.getElementById('savedProductLabel'),
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

    async function loadProducts({ throwOnError = false } = {}) {
        try {
            const response = await fetch('/api/saved-products', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`Failed to load saved products (${response.status}).`);
            }
            const products = await response.json();
            if (!Array.isArray(products)) {
                throw new Error('Invalid saved products response.');
            }
            state.savedProducts = products.map((p, i) => ({
                id: String(p.id ?? p.name ?? `prod_${i}`),
                name: p.name || p.title || `Product #${i + 1}`,
                type: p.type || p.productType || 'club',
                raw: p
            }));
            renderProductSelect();
            syncFormToMoment(state.currentMoment);
            renderStage();
            return;
        } catch (err) {
            console.error('Failed to load saved products from server:', err);
            if (throwOnError) throw err;
        }

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
        syncFormToMoment(state.currentMoment);
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
        } else {
            state.selectedProductId = '';
            dom.productSelect.value = '';
        }
    }

    let savedPicker = null;

    function closeSavedPicker() {
        savedPicker?.remove();
        savedPicker = null;
    }

    function chooseSavedProduct(product) {
        if (!state.currentMoment) return;
        state.pendingProductId = product.id;
        state.pendingMomentId = state.currentMoment.id;
        state.selectedProductId = product.id;
        if (dom.productSelect) dom.productSelect.value = product.id;
        closeSavedPicker();
        syncFormToMoment(state.currentMoment);
    }

    async function openSavedPicker() {
        if (savedPicker || !state.currentMoment) return;

        const overlay = document.createElement('div');
        overlay.className = 'design-modal';
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeSavedPicker();
        });

        const box = document.createElement('div');
        box.className = 'design-modal-box saved-picker-box';
        const head = document.createElement('div');
        head.className = 'design-modal-head';
        const title = document.createElement('span');
        title.textContent = 'Choose Saved Product';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 't-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', closeSavedPicker);
        head.append(title, closeBtn);

        const list = document.createElement('div');
        list.className = 'saved-picker-list';
        const note = document.createElement('div');
        note.className = 'moment-list-empty';
        note.textContent = 'Loading saved Products...';
        list.append(note);
        box.append(head, list);
        overlay.append(box);
        document.body.append(overlay);
        savedPicker = overlay;

        try {
            await loadProducts({ throwOnError: true });
            if (savedPicker !== overlay) return;
            list.innerHTML = '';
            if (!state.savedProducts.length) {
                note.textContent = 'No saved Products yet.';
                list.append(note);
                return;
            }

            state.savedProducts.forEach((product) => {
                const raw = product.raw || {};
                const options = raw.options && typeof raw.options === 'object' ? raw.options : {};
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'saved-picker-item';

                const name = document.createElement('span');
                name.className = 'saved-picker-name';
                name.textContent = product.name;

                const meta = document.createElement('span');
                meta.className = 'saved-picker-meta';
                meta.textContent = `${options.productType || product.type} · ${options.effect || raw.effect || 'none'}`;

                const swatchA = document.createElement('span');
                swatchA.className = 'saved-picker-swatch';
                swatchA.style.backgroundColor = options.productColor || options.ballColor ||
                    options.colorKnob1 || raw.productColor || '#ffffff';
                const swatchB = document.createElement('span');
                swatchB.className = 'saved-picker-swatch';
                swatchB.style.backgroundColor = options.bodyColor || options.colorStaff ||
                    raw.bodyColor || '#ffffff';

                item.append(name, meta, swatchA, swatchB);
                item.addEventListener('click', () => chooseSavedProduct(product));
                list.append(item);
            });
        } catch (error) {
            if (savedPicker !== overlay) return;
            list.innerHTML = '';
            note.textContent = `Could not load Products: ${error.message}`;
            list.append(note);
        }
    }

    function productToOptions(product) {
        const raw = product.raw || {};
        if (raw.options && typeof raw.options === 'object' &&
            !Array.isArray(raw.options) && Object.keys(raw.options).length > 0) {
            return JSON.parse(JSON.stringify(raw.options));
        }
        const productColor = raw.productColor || raw.handleColor || '#ff5733';
        const brightness = Number(raw.brightness);
        const saturation = Number(raw.saturation);
        return {
            productType: raw.productType || raw.type || product.type,
            productColor,
            handleColor: productColor,
            bodyColor: raw.bodyColor || '#ffffff',
            ballColor: productColor,
            brightness: Number.isFinite(brightness) ? brightness : 1,
            saturation: Number.isFinite(saturation) ? saturation : 1,
            effect: raw.effect || 'none'
        };
    }

    function syncFormToMoment(m) {
        const hasMoment = Boolean(m);
        if (dom.momentTitleEdit) dom.momentTitleEdit.disabled = !hasMoment;
        if (dom.btnApply) dom.btnApply.disabled = !hasMoment;
        if (dom.btnEditIn3D) dom.btnEditIn3D.disabled = !hasMoment;
        if (dom.btnChooseProduct) dom.btnChooseProduct.disabled = !hasMoment;

        if (!m) {
            state.pendingProductId = null;
            state.pendingMomentId = null;
            if (dom.momentTitleEdit) dom.momentTitleEdit.value = '';
            if (dom.savedProductLabel) dom.savedProductLabel.textContent = 'No Product linked';
            return;
        }

        if (state.pendingMomentId && state.pendingMomentId !== m.id) {
            state.pendingProductId = null;
            state.pendingMomentId = null;
        }

        if (dom.momentTitleEdit) dom.momentTitleEdit.value = m.title || '';
        const linkedId = m.synchro?.productId == null ? '' : String(m.synchro.productId);
        if (linkedId && state.savedProducts.some((p) => p.id === linkedId)) {
            state.selectedProductId = linkedId;
            if (dom.productSelect) dom.productSelect.value = linkedId;
        }
        if (dom.savedProductLabel) {
            if (state.pendingMomentId === m.id && state.pendingProductId) {
                const selected = state.savedProducts.find((p) => p.id === state.pendingProductId);
                dom.savedProductLabel.textContent = selected
                    ? `Selected: ${selected.name} (click Apply to confirm)`
                    : 'Selected Product is unavailable';
            } else {
                const linked = state.savedProducts.find((p) => p.id === linkedId);
                const linkedName = m.synchro?.projectName || linked?.name;
                dom.savedProductLabel.textContent = linkedName
                    ? `Linked: ${linkedName}` : 'No Product linked';
            }
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
        const current = state.currentMoment;
        const pendingId = state.pendingMomentId === current.id ? state.pendingProductId : null;
        const chosenId = pendingId || (dom.productSelect ? state.selectedProductId : null);
        const product = state.savedProducts.find((p) => p.id === chosenId);
        const changes = { title: dom.momentTitleEdit?.value };
        if (product) {
            changes.options = productToOptions(product);
            changes.synchro = {
                ...(current.synchro || {}),
                productId: product.id,
                projectName: product.name
            };
        }
        const updated = window.MusicEditorAPI.updateMoment(current.id, changes);
        if (updated) {
            state.currentMoment = updated;
            state.pendingProductId = null;
            state.pendingMomentId = null;
            syncFormToMoment(updated);
            renderStage(`Applied changes to "${updated.title}"`);
        }
    }

    function renderStage(note) {
        const mom = window.MusicPlayerAPI?.isPlaying?.()
            ? (state.activePlayingMoment || state.currentMoment)
            : state.currentMoment;
        const linkedId = mom?.synchro?.productId == null ? '' : String(mom.synchro.productId);
        const product = state.savedProducts.find((p) => p.id === linkedId);

        if (dom.simProductStatus) {
            if (mom?.options?.productType) {
                dom.simProductStatus.textContent = `3D Design: ${mom.options.productType} (${mom.options.effect || 'none'})`;
            } else if (product) {
                dom.simProductStatus.textContent = `Product: ${product.name} (${product.type})`;
            } else {
                dom.simProductStatus.textContent = 'No design yet';
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
            product: product
                ? { id: product.id, name: product.name, type: product.type }
                : (mom.synchro?.projectName
                    ? { id: linkedId, name: mom.synchro.projectName }
                    : null),
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
        state.pendingProductId = e.target.value || null;
        state.pendingMomentId = state.currentMoment?.id || null;
        renderStage();
    });

    dom.btnRefresh?.addEventListener('click', () => loadProducts());
    dom.btnChooseProduct?.addEventListener('click', openSavedPicker);
    dom.btnApply?.addEventListener('click', applyToCurrentMoment);

    window.addEventListener('musicEditor:momentsUpdated', (e) => {
        state.moments = e.detail?.moments || [];
        if (state.currentMoment) {
            state.currentMoment = state.moments.find((m) => m.id === state.currentMoment.id) || null;
        }
        if (state.activePlayingMoment) {
            state.activePlayingMoment = state.moments.find((m) => m.id === state.activePlayingMoment.id) || null;
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

    window.addEventListener('musicEditor:playbackStopped', () => {
        state.activePlayingMoment = null;
        renderStage();
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
            syncFormToMoment(state.currentMoment);
            renderStage();
        }
    };

    syncFormToMoment(null);
    loadProducts();
})();
