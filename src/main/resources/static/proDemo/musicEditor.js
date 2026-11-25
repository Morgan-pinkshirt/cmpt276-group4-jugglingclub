(function () {
    // Play button image shown when stopped; Stop button image shown when playing
    const JESTER_ASSETS = {
        playSrc: './proDemo/editorImg/playbutton.jpg',
        stopSrc: './proDemo/editorImg/stopbutton.jpg'
    };

    const coreState = {
        musicFileName: 'No music loaded',
        isPlaying: false
    };

    const dom = {
        fileName: document.getElementById('audioFileName'),
        btnPlayStopToggle: document.getElementById('btnPlayStopToggle'),
        playStopIconImg: document.getElementById('playStopIconImg')
    };

    function fmtSec(s) {
        if (!Number.isFinite(s) || s < 0) s = 0;
        return `${s.toFixed(1)}s`;
    }

    function fmtClock(s) {
        if (!Number.isFinite(s) || s < 0) s = 0;
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${String(m).padStart(2, '0')}:${r.toFixed(1).padStart(4, '0')}`;
    }

    function formatMinutesDecimal(sec) {
        if (!Number.isFinite(sec) || sec <= 0) return '0m';
        const mins = sec / 60;
        const formatted = mins >= 10 ? mins.toFixed(1) : Number(mins.toFixed(2)).toString();
        return `${formatted}m`;
    }

    function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(`musicEditor:${name}`, { detail }));
    }

    function clone(o) {
        return JSON.parse(JSON.stringify(o));
    }

    function setActiveDisplayName(name) {
        if (!dom.fileName) return;
        dom.fileName.textContent = name || 'No music loaded';
    }

    function setCurrentMusicName(name) {
        coreState.musicFileName = name || 'No music loaded';
        if (dom.fileName) {
            dom.fileName.dataset.musicName = coreState.musicFileName;
        }
        setActiveDisplayName(coreState.musicFileName);
    }

    function getCurrentMusicName() {
        return coreState.musicFileName || 'No music loaded';
    }

    function updatePlayStopButtonUI(isPlaying = coreState.isPlaying) {
        coreState.isPlaying = Boolean(isPlaying);
        const btn = dom.btnPlayStopToggle;
        const img = dom.playStopIconImg;
        if (!btn || !img) return;

        if (coreState.isPlaying) {
            btn.classList.remove('is-stopped');
            btn.classList.add('is-playing');
            btn.title = 'Stop';
            btn.setAttribute('aria-label', 'Stop');
            img.src = JESTER_ASSETS.stopSrc;
            img.alt = 'Stop';
        } else {
            btn.classList.remove('is-playing');
            btn.classList.add('is-stopped');
            btn.title = 'Play';
            btn.setAttribute('aria-label', 'Play');
            img.src = JESTER_ASSETS.playSrc;
            img.alt = 'Play';
        }
    }

    if (dom.playStopIconImg) {
        dom.playStopIconImg.addEventListener('error', () => {
            const targetSrc = coreState.isPlaying ? JESTER_ASSETS.stopSrc : JESTER_ASSETS.playSrc;
            if (dom.playStopIconImg.getAttribute('src') !== targetSrc) {
                dom.playStopIconImg.src = targetSrc;
            }
        });
    }

    window.MusicEditorCore = {
        fmtSec,
        fmtClock,
        formatMinutesDecimal,
        emit,
        clone,
        setActiveDisplayName,
        setCurrentMusicName,
        getCurrentMusicName,
        updatePlayStopButtonUI
    };

    window.MusicEditorAPI = window.MusicEditorAPI || {};
    updatePlayStopButtonUI(false);
})();