(function () {
    const state = {
        moments: [],
        currentMoment: null,
        activePlayingMoment: null
    };

    const dom = {
        panel: document.getElementById('momentEditPanel'),
        btnTogglePanel: document.getElementById('btnTogglePanel'),
        btnExpandPanel: document.getElementById('btnExpandPanel'),

        momentTitleEdit: document.getElementById('momentEditTitleInput'),
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

    // momentEdit.js calls this whenever a moment is selected, entered or updated
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

    // ---------- Design editor modal (iframe view.html?embed=edit) ----------
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

    function setPanelCollapsed(collapsed) {
        if (!dom.panel || !dom.btnExpandPanel) return;
        dom.panel.classList.toggle('is-collapsed', collapsed);
        dom.btnExpandPanel.classList.toggle('is-hidden', !collapsed);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 210);
    }

    // ---------- Saved project picker (saves table on the server) ----------
    const SAVED_PROJECTS_URL = '/api/saved-projects';
    let savedPicker = null;

    function projectToOptions(p) {
        const color = p.productColor || '#ff5733';
        const bright = Number(p.brightness);
        const sat = Number(p.saturation);
        return {
            productType: p.productType || 'club',
            productColor: color,
            handleColor: color,
            bodyColor: p.bodyColor || '#ffffff',
            ballColor: color,
            brightness: Number.isFinite(bright) ? bright : 1.0,
            saturation: Number.isFinite(sat) ? sat : 1.0,
            effect: p.effect || 'none'
        };
    }

    function closeSavedPicker() {
        savedPicker?.remove();
        savedPicker = null;
    }

    function chooseSavedProject(p) {
        const target = state.currentMoment;
        if (!target || !window.MusicEditorAPI?.updateMoment) return;
        const updated = window.MusicEditorAPI.updateMoment(target.id, {
            options: projectToOptions(p),
            synchro: { ...(target.synchro || {}), productId: p.uid, projectName: p.projectname }
        });
        closeSavedPicker();
        if (updated) {
            state.currentMoment = updated;
            syncFormToMoment(updated);
            renderStage(`Applied "${p.projectname}" to "${updated.title}"`);
        }
    }

    async function openSavedPicker() {
        if (savedPicker || !state.currentMoment) return;

        const overlay = document.createElement('div');
        overlay.className = 'design-modal';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSavedPicker();
        });

        const box = document.createElement('div');
        box.className = 'design-modal-box saved-picker-box';

        const head = document.createElement('div');
        head.className = 'design-modal-head';
        const title = document.createElement('span');
        title.textContent = 'Choose a saved project';
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
        note.textContent = 'Loading...';
        list.append(note);

        box.append(head, list);
        overlay.append(box);
        document.body.append(overlay);
        savedPicker = overlay;

        try {
            const res = await fetch(SAVED_PROJECTS_URL, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });
            if (res.status === 401) throw new Error('Please log in first.');
            if (!res.ok) throw new Error(`Server error (${res.status})`);
            const projects = await res.json();
            if (!savedPicker) return;

            list.innerHTML = '';
            if (!Array.isArray(projects) || !projects.length) {
                note.textContent = 'No saved projects yet.';
                list.append(note);
                return;
            }
            projects.forEach((p) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'saved-picker-item';

                const name = document.createElement('span');
                name.className = 'saved-picker-name';
                name.textContent = p.projectname || `Project ${p.uid}`;

                const meta = document.createElement('span');
                meta.className = 'saved-picker-meta';
                meta.textContent = `${p.productType || 'club'} · ${p.effect || 'none'}`;

                const sw1 = document.createElement('span');
                sw1.className = 'saved-picker-swatch';
                sw1.style.background = p.productColor || '#ffffff';
                const sw2 = document.createElement('span');
                sw2.className = 'saved-picker-swatch';
                sw2.style.background = p.bodyColor || '#ffffff';

                item.append(name, meta, sw1, sw2);
                item.addEventListener('click', () => chooseSavedProject(p));
                list.append(item);
            });
        } catch (err) {
            if (!savedPicker) return;
            list.innerHTML = '';
            note.textContent = `Could not load projects: ${err.message}`;
            list.append(note);
        }
    }

    function syncFormToMoment(m) {
        const hasMoment = Boolean(m);
        if (dom.momentTitleEdit) dom.momentTitleEdit.disabled = !hasMoment;
        if (dom.btnApply) dom.btnApply.disabled = !hasMoment;
        if (dom.btnEditIn3D) dom.btnEditIn3D.disabled = !hasMoment;
        if (dom.btnChooseProduct) dom.btnChooseProduct.disabled = !hasMoment;

        if (!m) {
            if (dom.momentTitleEdit) dom.momentTitleEdit.value = '';
            if (dom.savedProductLabel) dom.savedProductLabel.textContent = 'No project linked';
            return;
        }

        if (dom.momentTitleEdit) dom.momentTitleEdit.value = m.title || '';
        if (dom.savedProductLabel) {
            dom.savedProductLabel.textContent = m.synchro?.projectName
                ? `Linked: ${m.synchro.projectName}`
                : 'No project linked';
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
            title: dom.momentTitleEdit?.value
        });
        if (updated) {
            state.currentMoment = updated;
            renderStage(`Saved "${updated.title}"`);
        }
    }

    function renderStage(note) {
        const mom = state.activePlayingMoment || state.currentMoment;

        if (dom.simProductStatus) {
            if (mom?.options?.productType) {
                dom.simProductStatus.textContent = `3D Design: ${mom.options.productType} (${mom.options.effect || 'none'})`;
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
            product: mom.synchro?.projectName
                ? { id: mom.synchro.productId, name: mom.synchro.projectName }
                : null,
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

    dom.btnChooseProduct?.addEventListener('click', openSavedPicker);
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
        openMomentEditor
    };

    syncFormToMoment(null);
})();