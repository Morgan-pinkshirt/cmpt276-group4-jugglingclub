(function () {
    const DB_NAME = 'JesterStudioAudioDB';
    const STORE_NAME = 'audioFiles';
    const AUDIO_KEY = 'currentTrack';
    const PROJECT_AUDIO_PREFIX = 'synchroProject:';

    function getAudioKey(projectId) {
        if (projectId === undefined || projectId === null || projectId === '') {
            return AUDIO_KEY;
        }
        const id = String(projectId);
        if (!/^[1-9]\d*$/.test(id)) {
            throw new Error('Invalid Synchro project ID.');
        }
        return `${PROJECT_AUDIO_PREFIX}${id}`;
    }

    function openAudioDB() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB not supported'));
                return;
            }
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function saveAudioToDB(record, projectId = null) {
        try {
            const db = await openAudioDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(record, getAudioKey(projectId));
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            db.close();
        } catch (err) {
            console.error('Failed to save audio to IndexedDB:', err);
        }
    }

    async function loadAudioFromDB(projectId = null) {
        try {
            const db = await openAudioDB();
            const data = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(getAudioKey(projectId));
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return data;
        } catch (err) {
            console.error('Failed to load audio from IndexedDB:', err);
            return null;
        }
    }

    async function clearAudioFromDB(projectId = null) {
        try {
            const db = await openAudioDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(getAudioKey(projectId));
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            db.close();
        } catch (err) {
            console.error('Failed to clear audio from IndexedDB:', err);
        }
    }

    window.JesterAudioStorage = {
        saveAudioToDB,
        loadAudioFromDB,
        clearAudioFromDB
    };
})();
