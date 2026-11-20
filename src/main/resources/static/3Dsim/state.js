function saveStateAndRedirect(event, targetUrl) {
    event.preventDefault();

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

    sessionStorage.setItem('tempSelection', JSON.stringify(currentSelection));
    window.location.href = targetUrl;
}

function restoreFromSessionStorage() {
    const savedTempData = sessionStorage.getItem('tempSelection');
    if (!savedTempData) return;

    const data = JSON.parse(savedTempData);

    const setField = (ids, value) => {
        if (value === undefined || value === null || value === '') return;
        for (let id of ids) {
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

    sessionStorage.removeItem('tempSelection');
    console.log("Restored temporary selection successfully in 3D:", data);

    if (typeof updateProduct === 'function') updateProduct();
    setTimeout(() => { if (typeof updateEffect === 'function') updateEffect(); }, 50);
}

