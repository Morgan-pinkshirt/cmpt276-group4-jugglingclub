function saveStateAndRedirect(event, targetUrl) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    // Fallback to originalHandleHex / originalBodyHex if DOM input isn't present or was altered
    const handleHex = document.getElementById('productColor')?.value
        || (typeof originalHandleHex !== 'undefined' ? originalHandleHex : '#ffffff');
    const bodyHex = document.getElementById('bodyColor')?.value
        || (typeof originalBodyHex !== 'undefined' ? originalBodyHex : '#ffffff');

    const currentSelection = {
        UID: document.querySelector('input[name="UID"]')?.value || document.getElementById('UID')?.value || 'new',
        projectname: document.getElementById('projectName')?.value || document.getElementById('projectname')?.value || 'My Project',
        productType: document.getElementById('propTypeSelector')?.value || document.getElementById('productType')?.value || 'club',

        productColor: handleHex,
        bodyColor: bodyHex,
        handleColor: handleHex,
        ballColor: document.getElementById('ballColor')?.value || '',

        brightness: 1,
        saturation: 1,

        effect: document.getElementById('effectSelect')?.value || document.getElementById('effect')?.value || 'none'
    };

    try {
        sessionStorage.setItem('tempSelection', JSON.stringify(currentSelection));
    } catch (err) {
        console.error('Failed to save tempSelection:', err);
    }

    window.location.href = targetUrl;
}

// --- EMBED MODE (?embed=1 stage only, ?embed=edit editor inside synchro) ---
const JESTER_EMBED = new URLSearchParams(window.location.search).get('embed');
const JESTER_IS_FRAMED = window.parent && window.parent !== window;

if (JESTER_EMBED) {
    document.addEventListener('DOMContentLoaded', () => document.body.classList.add('embed-' + JESTER_EMBED));
}

// Push options into the inputs, then refresh the product and effect (shared by restore and postMessage)
function applyDesignTo3D(data) {
    if (!data || typeof data !== 'object') return;

    const setField = (ids, value) => {
        if (value === undefined || value === null || value === '') return;
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) {
                el.value = value;
                el.dispatchEvent(new Event('input'));
                el.dispatchEvent(new Event('change'));
                break;
            }
        }
    };

    const uidInput = document.querySelector('input[name="UID"]') || document.getElementById('UID');
    if (uidInput && data.UID) uidInput.value = data.UID;

    setField(['projectName', 'projectname'], data.projectname);

    if (data.productType) {
        const propSelector = document.getElementById('propTypeSelector') || document.getElementById('productType');
        if (propSelector) {
            propSelector.value = data.productType;
            propSelector.dispatchEvent(new Event('change'));
        }
    }

    setField(['productColor'], data.handleColor || data.productColor);
    setField(['bodyColor'], data.bodyColor);
    setField(['ballColor'], data.ballColor);

    // Staff: set knobType first so the mesh is built with the right shape, then set the colors
    setField(['knobType'], data.knobType);
    setField(['knob1Color'], data.colorKnob1);
    setField(['knob2Color'], data.colorKnob2);
    setField(['staffColor'], data.colorStaff);

    let brightnessVal = data.brightness !== undefined ? Number(data.brightness) : 1;
    if (brightnessVal > 2) brightnessVal = brightnessVal / 100;
    let saturationVal = data.saturation !== undefined ? Number(data.saturation) : 1;
    if (saturationVal > 2) saturationVal = saturationVal / 100;
    setField(['brightnessRange', 'brightness'], brightnessVal);
    setField(['saturationRange', 'saturation'], saturationVal);

    const effectEl = document.getElementById('effectSelect') || document.getElementById('effect');
    if (effectEl && data.effect) {
        effectEl.value = data.effect;
        effectEl.dispatchEvent(new Event('change'));

        const container = document.getElementById('customSelectionContainer');
        if (container) {
            const matchingItem =
                container.querySelector(`[data-value="${CSS.escape(data.effect)}"]`) ||
                container.querySelector(`[data-effect="${CSS.escape(data.effect)}"]`);

            if (matchingItem) {
                const itemTextEl = matchingItem.querySelector('span, .label, .name') || matchingItem;
                const labelText = itemTextEl.textContent.trim();

                const triggerTextEl =
                    container.querySelector('.selected-text, .dropdown-label, .select-value, span') ||
                    container.querySelector('button, .dropdown-toggle');

                if (triggerTextEl && labelText) {
                    triggerTextEl.textContent = labelText;
                }
            } else if (effectEl.selectedIndex >= 0) {
                // Fallback take text from <select>
                const labelText = effectEl.options[effectEl.selectedIndex].textContent.trim();
                const triggerTextEl =
                    container.querySelector('.selected-text, .dropdown-label, .select-value, span') ||
                    container.querySelector('button, .dropdown-toggle');
                if (triggerTextEl && labelText) {
                    triggerTextEl.textContent = labelText;
                }
            }
        }
    }

    if (typeof updateProduct === 'function') updateProduct();
    setTimeout(() => {
        if (typeof updateEffect === 'function') updateEffect();
    }, 50);
}

function restoreFromSessionStorage() {
    // The stage iframe shares sessionStorage with the synchro page: it must not consume the parent's tempSelection
    if (JESTER_EMBED === '1') return;

    const savedTempData = sessionStorage.getItem('tempSelection');
    if (!savedTempData) return;

    let data = null;
    try {
        data = JSON.parse(savedTempData);
    } catch (err) {
        console.error('Failed to parse tempSelection:', err);
        return;
    }

    applyDesignTo3D(data);
    sessionStorage.removeItem('tempSelection');
    console.log('Restored temporary selection successfully in 3D:', data);
}

// --- MOMENT <-> 3D BRIDGE ---
(function () {
    const PENDING_TARGET_KEY = 'synchroPendingMomentTarget';
    const MOMENT_RESULT_KEY = 'synchroMomentDesignResult';
    const TEMP_SELECTION_KEY = 'tempSelection';
    const SYNCHRO_DRAFT_KEY = 'synchroMomentsDraft';

    function safeParseJson(raw, fallback = null) {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('Failed to parse JSON from sessionStorage:', err);
            return fallback;
        }
    }

    function normalizeFactor(val, fallback = 1.0) {
        const num = Number(val);
        if (!Number.isFinite(num)) return fallback;
        return num > 2 ? num / 100 : num;
    }

    function resolveEffectName() {
        if (typeof selectedEffectName === 'string' && selectedEffectName.trim()) {
            return selectedEffectName.trim();
        }
        const effectSelect = document.getElementById('effectSelect') || document.getElementById('effect');
        return effectSelect?.value || 'none';
    }

    function collect3DDesignOptions() {
        const handleHex = document.getElementById('productColor')?.value
            || (typeof originalHandleHex !== 'undefined' ? originalHandleHex : '#ff5733');
        const bodyHex = document.getElementById('bodyColor')?.value
            || (typeof originalBodyHex !== 'undefined' ? originalBodyHex : '#ffffff');
        const ballHex = document.getElementById('ballColor')?.value
            || (typeof originalBallColorHex !== 'undefined' ? originalBallColorHex : handleHex);

        const productType = document.getElementById('propTypeSelector')?.value
            || document.getElementById('productType')?.value
            || 'club';

        const brightness = normalizeFactor(
            document.getElementById('brightnessRange')?.value ?? document.getElementById('brightness')?.value,
            1.0
        );
        const saturation = normalizeFactor(
            document.getElementById('saturationRange')?.value ?? document.getElementById('saturation')?.value,
            1.0
        );

        const knobType = document.getElementById('knobType')?.value || 'ball';
        const colorKnob1 = document.getElementById('knob1Color')?.value || '#222222';
        const colorKnob2 = document.getElementById('knob2Color')?.value || '#222222';
        const colorStaff = document.getElementById('staffColor')?.value || bodyHex || '#cccccc';

        const effect = resolveEffectName();

        return {
            productType,
            productColor: productType === 'ball' ? ballHex : handleHex,
            handleColor: handleHex,
            bodyColor: bodyHex,
            ballColor: ballHex,
            brightness,
            saturation,
            knobType,
            colorKnob1,
            colorKnob2,
            colorStaff,
            effect
        };
    }

    function syncOptionsIntoDraft(momentId, options) {
        if (!momentId) return;
        const draft = safeParseJson(sessionStorage.getItem(SYNCHRO_DRAFT_KEY), null);
        if (!draft || !Array.isArray(draft.moments)) return;

        draft.moments = draft.moments.map((m) =>
            m.id === momentId
                ? { ...m, options: { ...(m.options || {}), ...options } }
                : m
        );
        draft.selectedMomentId = momentId;

        try {
            sessionStorage.setItem(SYNCHRO_DRAFT_KEY, JSON.stringify(draft));
        } catch (err) {
            console.error('Failed to sync design options into draft:', err);
        }
    }

    function commitMomentDesignFrom3D(customOptions = null) {
        const targetMeta = safeParseJson(sessionStorage.getItem(PENDING_TARGET_KEY), null);
        const options = {
            ...collect3DDesignOptions(),
            ...(customOptions && typeof customOptions === 'object' ? customOptions : {})
        };

        if (targetMeta && targetMeta.momentId) {
            const payload = {
                momentId: targetMeta.momentId,
                options,
                savedAt: Date.now()
            };

            try {
                sessionStorage.setItem(MOMENT_RESULT_KEY, JSON.stringify(payload));
            } catch (err) {
                console.error('Failed to save synchroMomentDesignResult:', err);
            }

            syncOptionsIntoDraft(targetMeta.momentId, options);
            sessionStorage.removeItem(PENDING_TARGET_KEY);
        }

        return targetMeta?.returnUrl || 'synchro.html';
    }

    if (!window.Moment3DBridge) {
        window.Moment3DBridge = {
            openMomentIn3D(moment, target3DUrl = 'view.html', returnUrl = 'synchro.html') {
                if (!moment || !moment.id) return;
                const mergedOptions = {
                    productType: 'club',
                    productColor: '#ff5733',
                    handleColor: '#ff5733',
                    bodyColor: '#ffffff',
                    ballColor: '#ff5733',
                    brightness: 1.0,
                    saturation: 1.0,
                    knobType: 'ball',
                    colorKnob1: '#222222',
                    colorKnob2: '#222222',
                    colorStaff: '#cccccc',
                    effect: 'none',
                    ...(moment.options && typeof moment.options === 'object' ? moment.options : {})
                };

                try {
                    sessionStorage.setItem(
                        PENDING_TARGET_KEY,
                        JSON.stringify({
                            momentId: moment.id,
                            title: moment.title || '',
                            returnUrl
                        })
                    );
                    sessionStorage.setItem(TEMP_SELECTION_KEY, JSON.stringify(mergedOptions));
                } catch (err) {
                    console.error('Failed to prepare 3D handoff:', err);
                }

                window.location.href = target3DUrl;
            }
        };
    }

    const STAGE_DEFAULTS = {
        productType: 'club',
        productColor: '#ff5733',
        handleColor: '#ff5733',
        bodyColor: '#ffffff',
        ballColor: '#ff5733',
        brightness: 1.0,
        saturation: 1.0,
        knobType: 'ball',
        colorKnob1: '#222222',
        colorKnob2: '#222222',
        colorStaff: '#cccccc',
        effect: 'none'
    };

    function saveMomentAndReturn(event) {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();

        // Modal mode inside synchro: send the result to the parent page instead of navigating
        if (JESTER_EMBED === 'edit' && JESTER_IS_FRAMED) {
            const momentId = new URLSearchParams(window.location.search).get('moment');
            window.parent.postMessage(
                { type: 'saveMoment', momentId, options: collect3DDesignOptions() },
                window.location.origin
            );
            return;
        }
        window.location.href = commitMomentDesignFrom3D();
    }

    // The parent page (synchro) drives the 3D product through postMessage
    window.addEventListener('message', (e) => {
        if (e.origin !== window.location.origin) return;
        const msg = e.data;
        if (!msg || msg.type !== 'applyMoment') return;
        const opts = msg.options && typeof msg.options === 'object' ? msg.options : {};
        applyDesignTo3D({ ...STAGE_DEFAULTS, ...opts });
    });

    // Tell the parent page the stage is ready to receive moments
    window.addEventListener('load', () => {
        if (JESTER_EMBED && JESTER_IS_FRAMED) {
            window.parent.postMessage({ type: 'stageReady' }, window.location.origin);
        }
    });

    window.JesterStateBridge = {
        collect3DDesignOptions,
        commitMomentDesignFrom3D,
        saveMomentAndReturn,
        applyDesignTo3D,
        restoreFromSessionStorage
    };
})();