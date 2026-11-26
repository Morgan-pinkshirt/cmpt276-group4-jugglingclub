(function () {
    const core = window.MusicEditorCore;
    if (!core) return;

    const ALLOWED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac']);
    const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
    let loadRequestId = 0;

    const state = {
        audioCtx: null,
        audioBuffer: null,
        audioElement: new Audio(),
        objectUrl: null,
        duration: 0,
        musicStart: 0,
        musicEnd: 0,
        isPlaying: false
    };

    const dom = {
        fileInput: document.getElementById('audioFileInput'),
        durationLabel: document.getElementById('audioDurationLabel'),
        btnPlayStopToggle: document.getElementById('btnPlayStopToggle'),
        musicTrackLane: document.getElementById('musicTrackLane'),
        canvas: document.getElementById('waveformCanvas'),
        playheadLine: document.getElementById('playheadLine')
    };

   function getAudioCtx() {
        if (!state.audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) throw new Error('This browser does not support audio decoding.');
            state.audioCtx = new Ctx();
        }
        return state.audioCtx;
    }

    function updateDurationClock() {
        if (!dom.durationLabel) return;
        const cur = state.audioElement.currentTime || 0;
        dom.durationLabel.textContent = `${core.fmtClock(cur)} / ${core.fmtClock(state.musicEnd || state.duration)}`;
    }

    function drawWaveform() {
        if (!dom.canvas) return;
        const ctx = dom.canvas.getContext('2d');
        const w = dom.canvas.clientWidth || 600;
        const h = dom.canvas.height || 38;
        dom.canvas.width = w;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#1c202a';
        ctx.fillRect(0, 0, w, h);

        if (!state.audioBuffer) return;

        const ch = state.audioBuffer.getChannelData(0);
        const step = Math.max(1, Math.floor(ch.length / w));
        const mid = h / 2;

        ctx.fillStyle = '#a855f7';
        for (let x = 0; x < w; x++) {
            const s = x * step;
            const e = Math.min(s + step, ch.length);
            let min = 1;
            let max = -1;
            for (let i = s; i < e; i++) {
                const v = ch[i];
                if (v < min) min = v;
                if (v > max) max = v;
            }
            const top = mid + min * mid * 0.88;
            const barH = Math.max(2, (max - min) * mid * 0.88);
            ctx.fillRect(x, top, 1.5, barH);
        }
    }

    function startPlayback() {
        if (!state.duration) return;
        const cur = state.audioElement.currentTime;
        if (cur < state.musicStart || cur >= state.musicEnd) {
            state.audioElement.currentTime = state.musicStart;
        }
        state.audioElement.play().catch((err) => console.error('Play failed:', err));
        state.isPlaying = true;
        core.updatePlayStopButtonUI(true);
    }

    function stopPlayback() {
        state.audioElement.pause();
        state.isPlaying = false;
        state.audioElement.currentTime = state.musicStart;
        core.updatePlayStopButtonUI(false);
        updatePlayhead();
        core.emit('playbackStopped', {
            currentTime: state.audioElement.currentTime,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd
        });
    }

    function togglePlayStop() {
        if (!state.duration) return;
        if (state.isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    }

    function updatePlayhead() {
        if (!dom.playheadLine || !dom.musicTrackLane) return;
        const laneLeft = dom.musicTrackLane.offsetLeft;
        const laneWidth = dom.musicTrackLane.getBoundingClientRect().width || 1;

        if (!state.duration) {
            dom.playheadLine.style.left = `${laneLeft}px`;
            updateDurationClock();
            return;
        }

        const cur = state.audioElement.currentTime;
        if (state.isPlaying && cur >= state.musicEnd) {
            stopPlayback();
            return;
        }

        const ratio = Math.max(0, Math.min(1, cur / state.duration));
        dom.playheadLine.style.left = `${laneLeft + ratio * laneWidth}px`;
        updateDurationClock();

        core.emit('playbackTick', {
            currentTime: cur,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd
        });
    }

    function seekByClientX(clientX, element) {
        if (!state.duration || !element) return;
        const rect = element.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
        const target = Math.max(state.musicStart, Math.min(state.musicEnd, ratio * state.duration));
        state.audioElement.currentTime = target;
        updatePlayhead();
    }

    function seekTo(sec) {
        if (!state.duration || !Number.isFinite(sec)) return;
        state.audioElement.currentTime = Math.max(state.musicStart, Math.min(state.musicEnd, sec));
        updatePlayhead();
    }

    function setMusicBounds(start, end) {
        state.musicStart = Number(start) || 0;
        state.musicEnd = Number(end) || 0;
        if (state.audioElement.currentTime < state.musicStart) {
            state.audioElement.currentTime = state.musicStart;
        } else if (state.audioElement.currentTime > state.musicEnd) {
            state.audioElement.currentTime = state.musicStart;
        }
        updatePlayhead();
        core.emit('musicRangeChanged', {
            musicStart: state.musicStart,
            musicEnd: state.musicEnd
        });
    }

    async function loadFile(file, { restored = false } = {}) {
        if (!file) return;

        const requestId = ++loadRequestId;
        const extension = String(file.name || '').split('.').pop().toLowerCase();
        if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
            throw new Error('Unsupported audio format. Use MP3, WAV, OGG, M4A, or FLAC.');
        }
        if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
            throw new Error('The audio file must be larger than 0 bytes and no more than 25 MB.');
        }

        const buf = await file.arrayBuffer();
        let decodedBuffer;
        try {
            decodedBuffer = await getAudioCtx().decodeAudioData(buf);
        } catch (err) {
            throw new Error('This audio file could not be decoded. Please select another file.');
        }
        if (!Number.isFinite(decodedBuffer.duration) || decodedBuffer.duration <= 0) {
            throw new Error('This audio file does not have a valid duration.');
        }
        if (requestId !== loadRequestId) return;

        const nextObjectUrl = URL.createObjectURL(file);
        const previousObjectUrl = state.objectUrl;
        stopPlayback();
        state.objectUrl = nextObjectUrl;
        state.audioElement.src = nextObjectUrl;
        if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
        state.audioBuffer = decodedBuffer;
        state.duration = Number(decodedBuffer.duration.toFixed(2));
        state.musicStart = 0;
        state.musicEnd = state.duration;
        core.setCurrentMusicName(file.name);

        if (dom.btnPlayStopToggle) dom.btnPlayStopToggle.disabled = false;

        state.audioElement.currentTime = state.musicStart;
        drawWaveform();
        updatePlayhead();

        core.emit('loaded', {
            file,
            restored,
            fileName: file.name,
            duration: state.duration,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd
        });
        core.emit('musicTrackFocused', { hasMusic: true, fromLoad: true });
    }

    async function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await loadFile(file);
        } catch (err) {
            console.error('Load audio failed:', err);
            showAudioErrorDialog(err, file);
            if (dom.fileInput) dom.fileInput.value = '';
        }
    }

    function showAudioErrorDialog(error, file) {
        const dialog = document.getElementById('audioErrorDialog');
        const title = document.getElementById('audioErrorTitle');
        const description = document.getElementById('audioErrorMessage');
        if (!dialog || !title || !description) {
            console.error('Audio error dialog is unavailable:', error);
            return;
        }

        const message = error?.message || 'Unable to load the audio file.';
        let heading = 'Audio Loading Failed';
        let explanation = message;

        if (message.startsWith('Unsupported audio format.')) {
            heading = 'Unsupported Audio Format';
        } else if (file?.size === 0) {
            heading = 'Invalid Audio File';
            explanation = 'The selected audio file is empty. Please choose another file.';
        } else if (file?.size > MAX_AUDIO_BYTES) {
            heading = 'File Too Large';
            explanation = 'The audio file exceeds the 25 MB limit.';
        }

        title.textContent = heading;
        description.textContent = explanation;
        if (!dialog.open) dialog.showModal();
    }

    function clearMusic() {
        loadRequestId++;
        stopPlayback();

        if (state.objectUrl) {
            URL.revokeObjectURL(state.objectUrl);
            state.objectUrl = null;
        }
        state.audioElement.removeAttribute('src');
        state.audioElement.load();
        state.audioBuffer = null;

        state.duration = 0;
        state.musicStart = 0;
        state.musicEnd = 0;

        if (dom.fileInput) dom.fileInput.value = '';
        if (dom.btnPlayStopToggle) dom.btnPlayStopToggle.disabled = true;
        core.setCurrentMusicName('No music loaded');

        drawWaveform();
        updatePlayhead();
        core.emit('cleared', {});
    }

    dom.fileInput?.addEventListener('change', handleFileSelect);
    dom.btnPlayStopToggle?.addEventListener('click', togglePlayStop);

    dom.musicTrackLane?.addEventListener('click', (e) => {
        core.setActiveDisplayName(core.getCurrentMusicName());
        core.emit('musicTrackFocused', { hasMusic: Boolean(state.duration) });
        seekByClientX(e.clientX, dom.musicTrackLane);
    });

    state.audioElement.addEventListener('timeupdate', updatePlayhead);
    state.audioElement.addEventListener('ended', stopPlayback);
    window.addEventListener('resize', () => {
        drawWaveform();
        updatePlayhead();
    });

    window.MusicPlayerAPI = {
        getDuration: () => state.duration,
        isPlaying: () => state.isPlaying,
        getCurrentTime: () => state.audioElement.currentTime || 0,
        getMusicRange: () => ({
            duration: state.duration,
            musicStart: state.musicStart,
            musicEnd: state.musicEnd
        }),
        seekTo,
        seekByClientX,
        setMusicBounds,
        clearMusic,
        loadFile
    };

    window.MusicEditorAPI.getMusicRange = window.MusicPlayerAPI.getMusicRange;
    window.MusicEditorAPI.clearMusic = clearMusic;

    drawWaveform();
    updatePlayhead();
})();
