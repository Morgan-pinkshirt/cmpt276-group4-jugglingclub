(function () {
    const core = window.MusicEditorCore;
    const player = window.MusicPlayerAPI;
    if (!core || !player) return;

    const SYNCHRO_DRAFT_KEY = 'synchroMomentsDraft';
    const MOMENT_RESULT_KEY = 'synchroMomentDesignResult';
    const RETURNING_FROM_3D_KEY = 'synchroReturningFrom3D';
    const AudioStore = window.JesterAudioStorage;
    let pendingBounds = null;

    async function restoreMusicFromDB() {
        const rec = await AudioStore?.loadAudioFromDB();
        if (!rec?.blob) return;
        const draft = readDraftFromStorage();
        pendingBounds = draft ? { start: draft.musicStart, end: draft.musicEnd } : null;
        try {
            await player.loadFile(
                new File([rec.blob], rec.name || 'track', { type: rec.type }),
                { restored: true }
            );
        } catch (err) {
            console.error('Restore music failed:', err);
            pendingBounds = null;
        }
    }

    const state = {
        duration: 0,
        musicStart: 0,
        musicEnd: 0,
        momentStart: 0,
        momentEnd: 0,
        moments: [],
        selectedMomentId: null,
        focusTarget: null, // 'music' | 'moment' | null
        lastTriggeredMomentId: null,
        draggingAnchor: null
    };

    const dom = {
        btnExportMoments: document.getElementById('btnExportMoments'),
        momentTitleInput: document.getElementById('momentTitleInput'),
        momentStartLabel: document.getElementById('momentStartLabel'),
        momentEndLabel: document.getElementById('momentEndLabel'),
        btnCreateMoment: document.getElementById('btnCreateMoment'),
        btnDeleteMoment: document.getElementById('btnDeleteMoment'),
        btnEditMomentIn3D: document.getElementById('btnEditMomentIn3D'),
        rulerBar: document.getElementById('rulerBar'),
        momentsTrackLane: document.getElementById('momentsTrackLane'),
        trimLeft: document.getElementById('trimOutsideLeft'),
        trimRight: document.getElementById('trimOutsideRight'),
        activeRangeBracket: document.getElementById('activeRangeBracket'),
        momentRangePreview: document.getElementById('momentRangePreview'),
        momentsOverlay: document.getElementById('momentsOverlay'),
        anchors: {
            musicStart: document.getElementById('musicStartAnchor'),
            musicEnd: document.getElementById('musicEndAnchor'),
            momentStart: document.getElementById('momentStartAnchor'),
            momentEnd: document.getElementById('momentEndAnchor')
        }
    };

    function getMoments() {
        return state.moments.map(core.clone);
    }

    function readDraftFromStorage() {
        try {
            const raw = sessionStorage.getItem(SYNCHRO_DRAFT_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (err) {
            console.error('Failed to read moments draft:', err);
            return null;
        }
    }

    function isReturningFrom3D() {
        return (
            sessionStorage.getItem(RETURNING_FROM_3D_KEY) === '1' ||
            Boolean(sessionStorage.getItem(MOMENT_RESULT_KEY))
        );
    }

    function syncActionButtonsState() {
        if (dom.btnDeleteMoment) {
            const canDeleteMoment = Boolean(state.selectedMomentId);
            const canClearMusic = state.duration > 0;
            dom.btnDeleteMoment.disabled = !(canDeleteMoment || canClearMusic);
        }
        if (dom.btnEditMomentIn3D) {
            dom.btnEditMomentIn3D.disabled = !state.selectedMomentId;
        }
    }

    function applyMomentTo3D(moment) {
        if (!moment) return;
        if (typeof window.applyMomentOptions === 'function') {
            window.applyMomentOptions(moment.options || {});
        }
    }

    function persistMomentsDraft() {
        const draft = {
            duration: state.duration,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd,
            moments: getMoments(),
            selectedMomentId: state.selectedMomentId
        };
        try {
            sessionStorage.setItem(SYNCHRO_DRAFT_KEY, JSON.stringify(draft));
        } catch (err) {
            console.error('Failed to persist moments draft:', err);
        }
    }

    function clampMomentRange() {
        if (state.momentStart < state.musicStart) state.momentStart = state.musicStart;
        if (state.momentStart > state.musicEnd) state.momentStart = state.musicEnd;
        if (state.momentEnd < state.momentStart) state.momentEnd = state.momentStart;
        if (state.momentEnd > state.musicEnd) state.momentEnd = state.musicEnd;
    }

    function positionAnchors() {
        const dur = state.duration || 0;
        const pct = (sec) => (dur > 0 ? `${Math.max(0, Math.min(100, (sec / dur) * 100))}%` : '0%');

        if (dom.anchors.musicStart) dom.anchors.musicStart.style.left = pct(state.musicStart);
        if (dom.anchors.musicEnd) dom.anchors.musicEnd.style.left = pct(state.musicEnd);
        if (dom.anchors.momentStart) dom.anchors.momentStart.style.left = pct(state.momentStart);
        if (dom.anchors.momentEnd) dom.anchors.momentEnd.style.left = pct(state.momentEnd);
    }

    function syncRangeVisuals() {
        clampMomentRange();
        const dur = state.duration || 0;

        if (dom.momentStartLabel) dom.momentStartLabel.textContent = core.fmtSec(state.momentStart);
        if (dom.momentEndLabel) dom.momentEndLabel.textContent = core.fmtSec(state.momentEnd);

        if (dur > 0) {
            const leftPct = (state.musicStart / dur) * 100;
            const rightPct = ((dur - state.musicEnd) / dur) * 100;
            const activePct = ((state.musicEnd - state.musicStart) / dur) * 100;

            if (dom.trimLeft) dom.trimLeft.style.width = `${leftPct}%`;
            if (dom.trimRight) dom.trimRight.style.width = `${rightPct}%`;
            if (dom.activeRangeBracket) {
                dom.activeRangeBracket.style.left = `${leftPct}%`;
                dom.activeRangeBracket.style.width = `${activePct}%`;
            }

            const mLeftPct = (state.momentStart / dur) * 100;
            const mWidthPct = Math.max(0, ((state.momentEnd - state.momentStart) / dur) * 100);
            if (dom.momentRangePreview) {
                dom.momentRangePreview.style.left = `${mLeftPct}%`;
                dom.momentRangePreview.style.width = `${mWidthPct}%`;
            }
        } else {
            if (dom.trimLeft) dom.trimLeft.style.width = '0%';
            if (dom.trimRight) dom.trimRight.style.width = '0%';
            if (dom.activeRangeBracket) {
                dom.activeRangeBracket.style.left = '0%';
                dom.activeRangeBracket.style.width = '100%';
            }
            if (dom.momentRangePreview) {
                dom.momentRangePreview.style.left = '0%';
                dom.momentRangePreview.style.width = '0%';
            }
        }

        positionAnchors();
    }

    const OVERLAP_EPS = 0.001;
    const MIN_MOMENT_LEN = 0.1;

    function otherMoments(excludeId) {
        return state.moments
            .filter((m) => m.id !== excludeId)
            .sort((a, b) => a.start - b.start);
    }

    function getEditingMoment() {
        const m = state.moments.find((item) => item.id === state.selectedMomentId);
        if (!m) return null;
        const same =
            Math.abs(m.start - state.momentStart) < 0.011 &&
            Math.abs(m.end - state.momentEnd) < 0.011;
        return same ? m : null;
    }

    function getGapBounds(excludeId) {
        let lo = state.musicStart;
        let hi = state.musicEnd;
        otherMoments(excludeId).forEach((o) => {
            if (o.end <= state.momentStart + OVERLAP_EPS) lo = Math.max(lo, o.end);
            if (o.start >= state.momentEnd - OVERLAP_EPS) hi = Math.min(hi, o.start);
        });
        return { lo, hi };
    }

    function overlapsOthers(start, end, excludeId) {
        return otherMoments(excludeId).some(
            (o) => start < o.end - OVERLAP_EPS && end > o.start + OVERLAP_EPS
        );
    }

    function findFreeRange(start, span) {
        const sorted = otherMoments(null);
        let s = Math.max(state.musicStart, start);
        for (let pass = 0; pass <= sorted.length; pass++) {
            let moved = false;
            for (const o of sorted) {
                if (s < o.end - OVERLAP_EPS && s + span > o.start + OVERLAP_EPS) {
                    s = o.end;
                    moved = true;
                }
            }
            if (!moved) break;
        }
        const e = Math.min(state.musicEnd, s + span);
        if (e - s < MIN_MOMENT_LEN) return null;
        return { start: Number(s.toFixed(2)), end: Number(e.toFixed(2)) };
    }

    function relocateAnchorsToFreeGap() {
        const span = Math.max(0.5, state.momentEnd - state.momentStart);
        const free = findFreeRange(state.momentStart, span);
        if (free) {
            state.momentStart = free.start;
            state.momentEnd = free.end;
        } else {
            state.momentStart = state.musicEnd;
            state.momentEnd = state.musicEnd;
        }
    }

    function applyAnchorTime(anchorType, rawSec) {
        if (!state.duration) return;
        const sec = Number(Math.max(0, Math.min(state.duration, rawSec)).toFixed(2));

        if (anchorType === 'musicStart') {
            const nextStart = Math.min(sec, state.musicEnd);
            state.musicStart = nextStart;
            player.setMusicBounds?.(state.musicStart, state.musicEnd);
        } else if (anchorType === 'musicEnd') {
            const nextEnd = Math.max(sec, state.musicStart);
            state.musicEnd = nextEnd;
            player.setMusicBounds?.(state.musicStart, state.musicEnd);
        } else if (anchorType === 'momentStart' || anchorType === 'momentEnd') {
            const editing = getEditingMoment();
            const { lo, hi } = getGapBounds(editing ? editing.id : null);
            const minLen = editing ? MIN_MOMENT_LEN : 0;

            if (anchorType === 'momentStart') {
                state.momentStart = Math.max(lo, Math.min(sec, state.momentEnd - minLen));
                player.seekTo?.(state.momentStart);
            } else {
                state.momentEnd = Math.min(hi, Math.max(sec, state.momentStart + minLen));
            }

            if (editing) {
                editing.start = Number(state.momentStart.toFixed(2));
                editing.end = Number(state.momentEnd.toFixed(2));
                renderMoments();
                core.emit('momentsUpdated', { moments: getMoments() });
            }
        }

        syncRangeVisuals();
        persistMomentsDraft();
    }

    function bindAnchors() {
        Object.entries(dom.anchors).forEach(([type, el]) => {
            if (!el) return;
            el.addEventListener('pointerdown', (e) => {
                if (!state.duration) return;
                e.stopPropagation();
                state.draggingAnchor = type;
                el.setPointerCapture(e.pointerId);
            });
        });

        window.addEventListener('pointermove', (e) => {
            if (!state.draggingAnchor || !state.duration) return;
            const lane =
                state.draggingAnchor === 'musicStart' || state.draggingAnchor === 'musicEnd'
                    ? document.getElementById('musicTrackLane')
                    : dom.momentsTrackLane;
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
            applyAnchorTime(state.draggingAnchor, ratio * state.duration);
        });

        window.addEventListener('pointerup', () => {
            state.draggingAnchor = null;
        });
    }

    function renderRuler() {
        if (!dom.rulerBar) return;
        dom.rulerBar.innerHTML = '';
        if (!state.duration) return;

        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const sec = state.duration * ratio;
            const tick = document.createElement('span');
            tick.className = 'ruler-tick';
            tick.style.left = `${ratio * 100}%`;
            tick.textContent = core.formatMinutesDecimal(sec);
            dom.rulerBar.appendChild(tick);
        }
    }

    function createMoment() {
        if (!state.duration) return;
        clampMomentRange();

        let start = state.momentStart;
        let end = state.momentEnd;
        if (end <= start) {
            end = Math.min(state.musicEnd, Number((start + 1.0).toFixed(2)));
        }
        if (end <= start) return;

        if (overlapsOthers(start, end, null)) {
            const free = findFreeRange(start, Math.max(0.5, end - start));
            if (!free) return;
            start = free.start;
            end = free.end;
        }

        const idx = state.moments.length + 1;
        const title = dom.momentTitleInput?.value.trim() || `Moment ${idx}`;
        const moment = {
            id: `moment_${Date.now()}_${idx}`,
            title,
            start: Number(start.toFixed(2)),
            end: Number(end.toFixed(2)),
            options: null
        };

        state.moments.push(moment);
        state.selectedMomentId = moment.id;
        state.focusTarget = 'moment';
        if (dom.momentTitleInput) dom.momentTitleInput.value = '';

        state.momentStart = moment.start;
        state.momentEnd = moment.end;

        syncRangeVisuals();
        renderMoments();
        persistMomentsDraft();
        core.setActiveDisplayName(moment.title);
        core.emit('momentsUpdated', { moments: getMoments() });
        core.emit('momentSelected', { moment: core.clone(moment) });
        if (!player.isPlaying?.()) applyMomentTo3D(moment);
    }

    function selectMoment(id) {
        state.selectedMomentId = id;
        state.focusTarget = id ? 'moment' : (state.duration > 0 ? 'music' : null);
        const m = state.moments.find((item) => item.id === id);
        if (m) {
            state.momentStart = m.start;
            state.momentEnd = m.end;
            player.seekTo?.(m.start);
            core.setActiveDisplayName(m.title);
            syncRangeVisuals();
            if (!player.isPlaying?.()) applyMomentTo3D(m);
        }
        renderMoments();
        persistMomentsDraft();
        core.emit('momentSelected', { moment: m ? core.clone(m) : null });
    }

    function deleteSelectedMoment() {
        if (!state.selectedMomentId) return;
        state.moments = state.moments.filter((m) => m.id !== state.selectedMomentId);
        state.selectedMomentId = state.moments[0]?.id || null;
        state.focusTarget = state.selectedMomentId ? 'moment' : (state.duration > 0 ? 'music' : null);
        const sel = state.moments.find((m) => m.id === state.selectedMomentId) || null;
        if (sel) {
            state.momentStart = sel.start;
            state.momentEnd = sel.end;
        } else {
            state.momentStart = state.musicStart;
            state.momentEnd = Math.min(state.musicEnd, state.musicStart + 1);
        }
        renderMoments();
        syncRangeVisuals();
        persistMomentsDraft();
        core.setActiveDisplayName(sel ? sel.title : core.getCurrentMusicName());
        if (sel && !player.isPlaying?.()) {
            applyMomentTo3D(sel);
        }
        core.emit('momentsUpdated', { moments: getMoments() });
        core.emit('momentSelected', { moment: sel ? core.clone(sel) : null });
    }

    function handleDeleteAction() {
        if (state.focusTarget === 'moment' && state.selectedMomentId) {
            deleteSelectedMoment();
            return;
        }
        if (state.duration > 0) {
            player.clearMusic?.();
        }
    }

    function renderMoments() {
        state.moments.sort((a, b) => a.start - b.start);
        syncActionButtonsState();
        if (!dom.momentsOverlay) return;
        dom.momentsOverlay.innerHTML = '';

        const spanSec = state.duration || Math.max(0, ...state.moments.map((m) => Number(m.end) || 0));
        if (!spanSec) return;

        state.moments.forEach((m) => {
            const left = (m.start / spanSec) * 100;
            const width = Math.max(0.8, ((m.end - m.start) / spanSec) * 100);
            const clip = document.createElement('div');
            clip.className = `moment-clip ${m.id === state.selectedMomentId ? 'is-selected' : ''}`;
            clip.style.left = `${left}%`;
            clip.style.width = `${width}%`;
            clip.dataset.title = m.title;
            clip.title = `${m.title}: ${m.start}s - ${m.end}s`;
            clip.textContent = `${m.title} (${m.start}s–${m.end}s)`;
            clip.addEventListener('click', (ev) => {
                ev.stopPropagation();
                selectMoment(m.id);
            });
            dom.momentsOverlay.appendChild(clip);
        });
    }

    function updateMoment(momentId, updates = {}) {
        const m = state.moments.find((item) => item.id === momentId);
        if (!m) return null;
        if (typeof updates.title === 'string' && updates.title.trim()) {
            m.title = updates.title.trim();
        }
        if (updates.options && typeof updates.options === 'object') {
            const isProductApply = updates.synchro &&
                Object.prototype.hasOwnProperty.call(updates.synchro, 'productId');
            m.options = isProductApply
                ? core.clone(updates.options)
                : { ...(m.options || {}), ...updates.options };
        }
        if (updates.synchro && typeof updates.synchro === 'object') {
            m.synchro = { ...(m.synchro || {}), ...updates.synchro };
        }
        renderMoments();
        persistMomentsDraft();
        if (m.id === state.selectedMomentId) {
            core.setActiveDisplayName(m.title);
            applyMomentTo3D(m);
        }
        core.emit('momentsUpdated', { moments: getMoments() });
        return core.clone(m);
    }

    function editSelectedMomentIn3D(target3DUrl = 'view.html', returnUrl = 'synchro.html') {
        const moment = state.moments.find((m) => m.id === state.selectedMomentId);
        if (!moment) return;
        persistMomentsDraft();
        if (window.SynchroAPI && typeof window.SynchroAPI.openMomentEditor === 'function') {
            window.SynchroAPI.openMomentEditor(core.clone(moment));
            return;
        }
        sessionStorage.setItem(RETURNING_FROM_3D_KEY, '1');
        if (window.Moment3DBridge && typeof window.Moment3DBridge.openMomentIn3D === 'function') {
            window.Moment3DBridge.openMomentIn3D(moment, target3DUrl, returnUrl);
        }
    }

    function restoreMomentsDraftAndResult() {
        const draft = readDraftFromStorage();
        if (draft && Array.isArray(draft.moments) && draft.moments.length > 0) {
            state.duration = Number(draft.duration) || state.duration;
            state.musicStart = Number(draft.musicStart ?? state.musicStart) || 0;
            state.musicEnd = Number(draft.musicEnd ?? state.musicEnd) || state.duration;
            state.moments = draft.moments.map(core.clone);
            state.selectedMomentId = draft.selectedMomentId || draft.moments[0].id;
            state.focusTarget = state.selectedMomentId ? 'moment' : null;
        }

        const rawResult = sessionStorage.getItem(MOMENT_RESULT_KEY);
        if (rawResult) {
            try {
                const result = JSON.parse(rawResult);
                if (result && result.momentId && result.options) {
                    const targetMoment = state.moments.find((m) => m.id === result.momentId);
                    if (targetMoment) {
                        targetMoment.options = { ...(targetMoment.options || {}), ...result.options };
                        state.selectedMomentId = targetMoment.id;
                        state.focusTarget = 'moment';
                        persistMomentsDraft();
                        sessionStorage.removeItem(MOMENT_RESULT_KEY);
                    }
                }
            } catch (err) {
                console.error('Failed to apply 3D moment result:', err);
            }
        }

        if (state.moments.length > 0) {
            renderRuler();
            syncRangeVisuals();
            renderMoments();
            persistMomentsDraft();
            core.emit('momentsUpdated', { moments: getMoments() });

            const active = state.moments.find((m) => m.id === state.selectedMomentId) || state.moments[0];
            if (active) {
                state.momentStart = Number(active.start);
                state.momentEnd = Number(active.end);
                syncRangeVisuals();
                core.setActiveDisplayName(active.title);
                core.emit('momentSelected', { moment: core.clone(active) });
                applyMomentTo3D(active);
            }
        }

        sessionStorage.removeItem(RETURNING_FROM_3D_KEY);
    }

    function restoreProject(projectData) {
        if (!projectData || typeof projectData !== 'object' || !Array.isArray(projectData.moments)) {
            throw new Error('Invalid Synchro project data.');
        }

        const loadedDuration = Number(player.getDuration?.());
        const savedDuration = Number(projectData.duration);
        const musicStart = Number(projectData.musicStart);
        const musicEnd = Number(projectData.musicEnd);
        if (!Number.isFinite(loadedDuration) || loadedDuration <= 0) {
            throw new Error('Please load the project audio before restoring the Timeline.');
        }
        if (!Number.isFinite(savedDuration) || savedDuration <= 0 ||
            Math.abs(savedDuration - loadedDuration) > 0.5 ||
            !Number.isFinite(musicStart) || !Number.isFinite(musicEnd) ||
            musicStart < 0 || musicEnd <= musicStart || musicEnd > loadedDuration + 0.01) {
            throw new Error('The saved Timeline does not match the loaded audio.');
        }

        const restoredMoments = projectData.moments.map(core.clone);
        const ids = new Set();
        for (const moment of restoredMoments) {
            if (!moment || typeof moment.id !== 'string' || !moment.id ||
                typeof moment.title !== 'string' || !moment.title.trim() ||
                !Number.isFinite(moment.start) || !Number.isFinite(moment.end) ||
                moment.start < musicStart - 0.01 || moment.end <= moment.start ||
                moment.end > musicEnd + 0.01 || ids.has(moment.id) ||
                (moment.options != null &&
                    (typeof moment.options !== 'object' || Array.isArray(moment.options)))) {
                throw new Error('The saved project contains an invalid Moment.');
            }
            ids.add(moment.id);
        }

        const selectedId = restoredMoments.some((m) => m.id === projectData.selectedMomentId)
            ? projectData.selectedMomentId
            : (restoredMoments[0]?.id || null);
        const active = restoredMoments.find((m) => m.id === selectedId) || null;

        state.duration = loadedDuration;
        state.musicStart = musicStart;
        state.musicEnd = Math.min(musicEnd, loadedDuration);
        state.moments = restoredMoments;
        state.selectedMomentId = selectedId;
        state.focusTarget = active ? 'moment' : 'music';
        state.momentStart = active ? active.start : state.musicStart;
        state.momentEnd = active ? active.end : state.musicEnd;
        state.lastTriggeredMomentId = null;
        state.draggingAnchor = null;

        player.setMusicBounds?.(state.musicStart, state.musicEnd);
        if (dom.btnCreateMoment) dom.btnCreateMoment.disabled = false;
        if (dom.momentTitleInput) dom.momentTitleInput.value = '';
        renderRuler();
        syncRangeVisuals();
        renderMoments();
        persistMomentsDraft();
        core.setActiveDisplayName(active ? active.title : core.getCurrentMusicName());
        core.emit('momentsUpdated', { moments: getMoments() });
        core.emit('momentSelected', { moment: active ? core.clone(active) : null });
        if (active) applyMomentTo3D(active);
        player.seekTo?.(state.musicStart);
    }

    function exportMomentsJson() {
        const payload = {
            duration: state.duration,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd,
            moments: getMoments()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'synchro-moments.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    window.addEventListener('musicEditor:loaded', (e) => {
        const { duration, musicStart, musicEnd, file, restored } = e.detail || {};
        if (file && !restored) {
            AudioStore?.saveAudioToDB({ blob: file, name: file.name, type: file.type });
        }
        const prevSelectedId = state.selectedMomentId;
        const draft = readDraftFromStorage();
        const sourceMoments = state.moments.length > 0
            ? getMoments()
            : (Array.isArray(draft?.moments) ? draft.moments.map(core.clone) : []);

        state.duration = Number(duration) || 0;
        state.musicStart = Number(musicStart) || 0;
        state.musicEnd = Number(musicEnd) || state.duration;
        if (restored && pendingBounds) {
            const s = Math.min(Number(pendingBounds.start) || 0, state.duration);
            const en = Math.min(Number(pendingBounds.end) || state.duration, state.duration);
            state.musicStart = s;
            state.musicEnd = Math.max(s, en);
            player.setMusicBounds?.(state.musicStart, state.musicEnd);
        }
        pendingBounds = null;

        state.momentStart = 0;
        state.momentEnd = Math.min(state.duration, Number((state.duration * 0.25).toFixed(2)) || state.duration);

        if (state.duration > 0) {
            state.moments = sourceMoments
                .map((m) => {
                    const start = Math.max(0, Math.min(state.musicEnd, Number(m.start) || 0));
                    const end = Math.max(start, Math.min(state.musicEnd, Number(m.end) || start));
                    return { ...m, start, end };
                })
                .filter((m) => m.end > m.start);
        } else {
            state.moments = sourceMoments;
        }

        state.selectedMomentId =
            state.moments.find((m) => m.id === prevSelectedId)?.id || state.moments[0]?.id || null;
        {
            const sel = state.moments.find((m) => m.id === state.selectedMomentId);
            if (sel) {
                state.momentStart = sel.start;
                state.momentEnd = sel.end;
            }
        }
        state.focusTarget = state.selectedMomentId ? 'moment' : (state.duration > 0 ? 'music' : null);
        state.lastTriggeredMomentId = null;

        if (dom.btnCreateMoment) dom.btnCreateMoment.disabled = false;
        syncActionButtonsState();
        persistMomentsDraft();
        renderRuler();
        syncRangeVisuals();
        renderMoments();
        core.emit('momentsUpdated', { moments: getMoments() });

        const active = state.moments.find((m) => m.id === state.selectedMomentId) || null;
        if (active) {
            core.setActiveDisplayName(active.title);
            core.emit('momentSelected', { moment: core.clone(active) });
            applyMomentTo3D(active);
        }
    });

    window.addEventListener('musicEditor:musicTrackFocused', (e) => {
        if (e.detail?.fromLoad && state.selectedMomentId) {
            return;
        }
        const hasMusic = Boolean(e.detail?.hasMusic ?? state.duration > 0);
        state.selectedMomentId = null;
        state.focusTarget = hasMusic ? 'music' : null;
        renderMoments();
        persistMomentsDraft();
        core.emit('momentSelected', { moment: null });
    });

    window.addEventListener('musicEditor:cleared', () => {
        state.duration = 0;
        state.musicStart = 0;
        state.musicEnd = 0;
        state.momentStart = 0;
        state.momentEnd = 0;
        state.moments = [];
        state.selectedMomentId = null;
        state.focusTarget = null;
        state.lastTriggeredMomentId = null;

        sessionStorage.removeItem(SYNCHRO_DRAFT_KEY);
        AudioStore?.clearAudioFromDB();
        if (dom.momentTitleInput) dom.momentTitleInput.value = '';
        if (dom.btnCreateMoment) dom.btnCreateMoment.disabled = true;
        syncActionButtonsState();

        renderRuler();
        syncRangeVisuals();
        renderMoments();
        core.emit('momentsUpdated', { moments: [] });
        core.emit('momentSelected', { moment: null });
    });

    window.addEventListener('musicEditor:playbackStopped', () => {
        state.lastTriggeredMomentId = null;
        const selected = state.moments.find((m) => m.id === state.selectedMomentId);
        if (selected) applyMomentTo3D(selected);
    });

    window.addEventListener('musicEditor:playbackTick', (e) => {
        if (!player.isPlaying?.()) return;
        const cur = e.detail?.currentTime ?? 0;
        const activeMoment = state.moments.find((m) => cur >= m.start && cur <= m.end) || null;
        if (activeMoment && activeMoment.id !== state.lastTriggeredMomentId) {
            state.lastTriggeredMomentId = activeMoment.id;
            applyMomentTo3D(activeMoment);
            core.emit('momentEntered', { moment: core.clone(activeMoment), currentTime: cur });
        } else if (!activeMoment) {
            state.lastTriggeredMomentId = null;
        }
    });

    dom.btnCreateMoment?.addEventListener('click', createMoment);
    dom.btnDeleteMoment?.addEventListener('click', handleDeleteAction);
    dom.btnExportMoments?.addEventListener('click', exportMomentsJson);
    dom.btnEditMomentIn3D?.addEventListener('click', () => editSelectedMomentIn3D());

    dom.momentsTrackLane?.addEventListener('click', (e) => {
        if (e.target.closest('.timeline-anchor')) return;
        const clip = e.target.closest('.moment-clip');
        if (clip) {
            const momentTitle = clip.dataset.title;
            if (momentTitle) core.setActiveDisplayName(momentTitle);
        } else {
            state.selectedMomentId = null;
            state.focusTarget = state.duration > 0 ? 'music' : null;
            relocateAnchorsToFreeGap();
            syncRangeVisuals();
            renderMoments();
            persistMomentsDraft();
            core.setActiveDisplayName(core.getCurrentMusicName());
            core.emit('momentSelected', { moment: null });
        }
        player.seekByClientX?.(e.clientX, dom.momentsTrackLane);
    });

    dom.rulerBar?.addEventListener('click', (e) => {
        player.seekByClientX?.(e.clientX, dom.rulerBar);
    });

    window.addEventListener('resize', positionAnchors);

    Object.assign(window.MusicEditorAPI, {
        getMoments,
        selectMoment,
        updateMoment,
        editSelectedMomentIn3D,
        persistMomentsDraft,
        restoreProject
    });

    bindAnchors();
    syncRangeVisuals();
    renderMoments();
    const returningFrom3D = isReturningFrom3D();
    restoreMomentsDraftAndResult();
    if (returningFrom3D) restoreMusicFromDB();
})();
