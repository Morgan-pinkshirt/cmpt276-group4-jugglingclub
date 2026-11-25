(function () {
    const API_BASE = '/api/synchro-projects';
    const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
    const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac']);

    const state = {
        projectId: null,
        projectName: '',
        currentAudioFile: null,
        busy: false
    };

    const urlProjectId = new URLSearchParams(window.location.search).get('projectId');

    const getSaveButton = () => document.getElementById('btnSaveSynchro');
    const getSaveAsNewButton = () => document.getElementById('btnSaveAsNewSynchro');
    const getNameInput = () => document.getElementById('synchroProjectName');
    const getStatusElement = () => document.getElementById('synchroSaveStatus');

    function showStatus(message, isError = false) {
        const element = getStatusElement();
        if (element) {
            element.textContent = message;
            element.dataset.status = isError ? 'error' : 'success';
        } else if (isError) {
            const dialog = document.getElementById('audioErrorDialog');
            const title = document.getElementById('audioErrorTitle');
            const description = document.getElementById('audioErrorMessage');
            if (dialog && title && description) {
                title.textContent = 'Synchro Project Error';
                description.textContent = message;
                if (!dialog.open) dialog.showModal();
            } else {
                window.alert(message);
            }
        }
    }

    function syncSaveButtons() {
        const saveButton = getSaveButton();
        if (saveButton) saveButton.disabled = state.busy;
        const saveAsNewButton = getSaveAsNewButton();
        if (saveAsNewButton) saveAsNewButton.disabled = state.busy;
    }

    function setBusy(busy) {
        state.busy = busy;
        syncSaveButtons();
    }

    function assertAudioExtension(filename) {
        const extension = String(filename || '').split('.').pop().toLowerCase();
        if (!AUDIO_EXTENSIONS.has(extension)) {
            throw new Error('Unsupported audio format. Use MP3, WAV, OGG, M4A, or FLAC.');
        }
    }

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-store',
            ...options
        });
        if (!response.ok) {
            let message = `Request failed (${response.status}).`;
            try {
                const details = await response.json();
                if (typeof details.error === 'string') message = details.error;
            } catch (_) {
            }
            throw new Error(message);
        }
        return response;
    }

    async function getCurrentAudioFile() {
        const currentName = window.MusicEditorCore?.getCurrentMusicName?.();
        const current = state.currentAudioFile;
        if (current instanceof File && current.name === currentName) {
            return current;
        }

        const record = await window.JesterAudioStorage?.loadAudioFromDB?.(state.projectId);
        if (!record?.blob || !record.name || record.name !== currentName) {
            throw new Error('Please import a music file before saving.');
        }
        return new File([record.blob], record.name, {
            type: record.type || record.blob.type || ''
        });
    }

    function getProjectData(projectName) {
        const range = window.MusicPlayerAPI?.getMusicRange?.();
        const moments = window.MusicEditorAPI?.getMoments?.();
        if (!range || !Array.isArray(moments) || !Number.isFinite(range.duration) || range.duration <= 0) {
            throw new Error('Please import music before saving a Synchro project.');
        }
        if (!Number.isFinite(range.musicStart) || !Number.isFinite(range.musicEnd)
                || range.musicStart < 0 || range.musicEnd <= range.musicStart
                || range.musicEnd > range.duration + 0.01) {
            throw new Error('The music time range is invalid.');
        }
        const name = String(projectName || '').trim();
        if (!name || name.length > 150) {
            throw new Error('Please enter a project name of up to 150 characters.');
        }

        return {
            schemaVersion: 1,
            projectType: 'synchro',
            projectName: name,
            duration: range.duration,
            musicStart: range.musicStart,
            musicEnd: range.musicEnd,
            moments
        };
    }

    function getEnteredName() {
        return getNameInput()?.value?.trim() || state.projectName;
    }

    function setProjectName(name) {
        state.projectName = String(name || '');
        const input = getNameInput();
        if (input) input.value = state.projectName;
    }

    function updateProjectUrl(id) {
        const url = new URL(window.location.href);
        if (id == null) url.searchParams.delete('projectId');
        else url.searchParams.set('projectId', String(id));
        window.history.replaceState(window.history.state, '', url);
    }

    async function saveProject(projectName = getEnteredName(), asNew = false) {
        if (state.busy) throw new Error('A project operation is already in progress.');
        setBusy(true);
        try {
            const data = getProjectData(projectName);
            const audioFile = await getCurrentAudioFile();
            assertAudioExtension(audioFile.name);
            if (audioFile.size === 0 || audioFile.size > MAX_AUDIO_BYTES) {
                throw new Error('Audio must be larger than 0 bytes and no more than 25 MB.');
            }

            const form = new FormData();
            form.append('projectJson', JSON.stringify(data));
            form.append('audioFile', audioFile, audioFile.name);

            const updating = state.projectId != null && !asNew;
            const url = updating ? `${API_BASE}/${state.projectId}` : API_BASE;
            const response = await request(url, {
                method: updating ? 'PUT' : 'POST',
                body: form
            });
            const saved = await response.json();
            if (!Number.isSafeInteger(Number(saved.id))) {
                throw new Error('The server returned an invalid project ID.');
            }
            state.projectId = Number(saved.id);
            await window.JesterAudioStorage?.saveAudioToDB?.({
                blob: audioFile,
                name: audioFile.name,
                type: audioFile.type
            }, state.projectId);
            setProjectName(saved.projectName || data.projectName);
            updateProjectUrl(state.projectId);
            return saved;
        } finally {
            setBusy(false);
        }
    }

    async function loadProject(id) {
        if (state.busy) throw new Error('A project operation is already in progress.');
        if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
            throw new Error('Invalid Synchro project ID.');
        }
        if (typeof window.MusicEditorAPI?.restoreProject !== 'function') {
            throw new Error('The Timeline restoration component has not been installed yet.');
        }

        setBusy(true);
        try {
            const path = `${API_BASE}/${Number(id)}`;
            const [summaryResponse, projectResponse, audioResponse] = await Promise.all([
                request(path),
                request(`${path}/project`),
                request(`${path}/audio`)
            ]);
            const [summary, project, audioBlob] = await Promise.all([
                summaryResponse.json(),
                projectResponse.json(),
                audioResponse.blob()
            ]);
            if (project.projectType !== 'synchro' || project.schemaVersion !== 1
                    || !Array.isArray(project.moments)) {
                throw new Error('The Synchro project format is invalid.');
            }
            const filename = summary.audioFileName;
            assertAudioExtension(filename);
            if (audioBlob.size === 0 || audioBlob.size > MAX_AUDIO_BYTES) {
                throw new Error('The saved audio file has an invalid size.');
            }
            const file = new File([audioBlob], filename, {
                type: audioBlob.type || 'application/octet-stream'
            });
            const AudioContextType = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextType) {
                throw new Error('This browser does not support audio decoding.');
            }
            const context = new AudioContextType();
            try {
                await context.decodeAudioData(await file.arrayBuffer());
            } catch (_) {
                throw new Error('The audio file is not supported by this browser.');
            } finally {
                await context.close();
            }

            await window.MusicPlayerAPI.loadFile(file, { restored: true });
            window.MusicEditorAPI.restoreProject(project);
            await window.JesterAudioStorage?.saveAudioToDB?.({
                blob: file,
                name: file.name,
                type: file.type
            }, Number(id));
            state.currentAudioFile = file;
            state.projectId = Number(id);
            setProjectName(summary.projectName || project.projectName);
            updateProjectUrl(state.projectId);
            return summary;
        } finally {
            setBusy(false);
        }
    }

    async function listProjects() {
        const response = await request(API_BASE);
        return response.json();
    }

    async function importProject(file) {
        if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.zip')) {
            throw new Error('Please select a ZIP file.');
        }
        if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
            throw new Error('The ZIP file must be no more than 25 MB.');
        }
        const form = new FormData();
        form.append('file', file, file.name);
        const response = await request(`${API_BASE}/import`, { method: 'POST', body: form });
        return response.json();
    }

    async function exportProject(id = null) {
        if (state.busy) throw new Error('A project operation is already in progress.');
        setBusy(true);
        try {
            let response;
            let filename;

            if (id !== null && id !== undefined) {
                if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
                    throw new Error('Invalid Synchro project ID.');
                }
                response = await request(`${API_BASE}/${Number(id)}/export`);
                filename = `synchro-project-${Number(id)}.zip`;
            } else {
                let name = getEnteredName();
                if (!name) {
                    const entered = window.prompt('Enter a name for this Synchro project:');
                    if (entered === null) return;
                    name = entered.trim();
                }
                const data = getProjectData(name);
                const audioFile = await getCurrentAudioFile();
                assertAudioExtension(audioFile.name);
                if (audioFile.size === 0 || audioFile.size > MAX_AUDIO_BYTES) {
                    throw new Error('Audio must be larger than 0 bytes and no more than 25 MB.');
                }

                const form = new FormData();
                form.append('projectJson', JSON.stringify(data));
                form.append('audioFile', audioFile, audioFile.name);
                response = await request(`${API_BASE}/export-draft`, {
                    method: 'POST',
                    body: form
                });
                filename = 'synchro-project.zip';
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } finally {
            setBusy(false);
        }
    }

    function startNewProject() {
        if (state.busy) throw new Error('A project operation is already in progress.');
        window.MusicPlayerAPI?.clearMusic?.();
        state.currentAudioFile = null;
        state.projectId = null;
        setProjectName('');
        updateProjectUrl(null);
        syncSaveButtons();
        showStatus('New Synchro project started.');
    }

    window.addEventListener('musicEditor:loaded', (event) => {
        const file = event.detail?.file;
        if (file instanceof File) state.currentAudioFile = file;
    });

    window.addEventListener('musicEditor:cleared', () => {
        state.currentAudioFile = null;
    });

    async function handleSaveClick() {
        let name = getEnteredName();
        if (!name) {
            const entered = window.prompt('Enter a name for this Synchro project:');
            if (entered === null) return;
            name = entered.trim();
        }
        const creating = state.projectId == null;
        try {
            const result = await saveProject(name);
            showStatus(creating
                ? `Created Synchro project "${result.projectName}".`
                : `Saved changes to "${result.projectName}".`);
        } catch (error) {
            showStatus(error.message || 'Unable to save Synchro changes.', true);
        }
    }

    async function handleSaveAsNewClick() {
        const currentName = getEnteredName();
        const suggestion = currentName ? `${currentName} Copy` : '';
        const entered = window.prompt('Enter a name for the new Synchro project:', suggestion);
        if (entered === null) return;
        try {
            const result = await saveProject(entered.trim(), true);
            showStatus(`Created new Synchro project "${result.projectName}".`);
        } catch (error) {
            showStatus(error.message || 'Unable to create a new Synchro project.', true);
        }
    }

    async function handleExportClick() {
        try {
            await exportProject();
        } catch (error) {
            console.error('Failed to export the Synchro project:', error);
            showStatus(error.message || 'Unable to export the Synchro project.', true);
        }
    }

    getSaveButton()?.addEventListener('click', handleSaveClick);
    getSaveAsNewButton()?.addEventListener('click', handleSaveAsNewClick);
    document.getElementById('btnExportSynchroZip')?.addEventListener('click', handleExportClick);

    window.SynchroProjectAPI = {
        saveProject,
        saveAsNewProject: (projectName) => saveProject(projectName, true),
        loadProject,
        listProjects,
        importProject,
        exportProject,
        getProjectData,
        getCurrentProjectId: () => state.projectId,
        startNewProject
    };

    if (urlProjectId !== null) {
        loadProject(urlProjectId).catch((error) => {
            console.error('Failed to restore the Synchro project:', error);
            state.projectId = null;
            syncSaveButtons();
            showStatus(error.message || 'Unable to load the Synchro project.', true);
        });
    }
    syncSaveButtons();
})();

