// Effect Texture variables
let isDropdownInitialized = false;

// Initial setup (very lightweight, only updates the header)
function initCustomDropdown() {
    updateCustomHeader();
}

// Toggle dropdown visibility
function toggleCustomDropdown() {
    const listElem = document.getElementById('customDropdownList');
    if (!listElem) return;

    // First time the user opens it -> render the full list of effects + PNG images
    if (!isDropdownInitialized) {
        renderDropdownItems();
        isDropdownInitialized = true;
    }

    listElem.style.display = listElem.style.display === 'block' ? 'none' : 'block';
}

// Actually builds the items inside the dropdown
function renderDropdownItems() {
    const selectElem = document.getElementById('effectSelect');
    const listElem = document.getElementById('customDropdownList');
    if (!selectElem || !listElem) return;

    listElem.innerHTML = '';

    Array.from(selectElem.children).forEach(child => {
        if (child.tagName === 'OPTGROUP') {
            const groupLabel = document.createElement('div');
            groupLabel.innerText = child.label;
            groupLabel.style.cssText = ` 
            padding: 6px 10px; 
            font-size: 0.75rem; 
            font-weight: bold; 
            background: #151515; 
            color: #888; 
            border-bottom: 1px solid #333;`;

            listElem.appendChild(groupLabel);
            Array.from(child.children).forEach(opt => {
                createDropdownItem(opt, listElem);
            });
        } else if (child.tagName === 'OPTION') {
            createDropdownItem(child, listElem);
        }
    });
}

// Create each item row (original logic kept)
function createDropdownItem(opt, container) {
    const item = document.createElement('div');
    item.style.cssText = `
    display: flex; 
    align-items: center; 
    gap: 10px; 
    padding: 6px 10px; 
    cursor: pointer; 
    border-bottom: 1px solid #2a2a2a; 
    transition: background 0.2s;`;

    item.onmouseover = () => item.style.background = '#333';
    item.onmouseout = () => item.style.background = 'transparent';

    const val = opt.value;
    const text = opt.innerText;

    if (val === 'none') {
        item.innerHTML = `<span style="font-size: 0.85rem; color: #aaa;">${text}</span>`;
    } else {
        const imgPath = `/2d-sim/img/${val}.png`;
        item.innerHTML = `
            <img src="${imgPath}" loading="lazy" style="width: 24px; 
            height: 24px; 
            object-fit: contain; 
            background: #111; 
            border-radius: 2px; 
            padding: 1px;" 
            onerror="this.style.display='none'"/>
            <span style="font-size: 0.85rem; color: #fff;">${text}</span>`;
    }

    item.onclick = () => {
        const selectElem = document.getElementById('effectSelect');
        if (selectElem) {
            selectElem.value = val;
            selectElem.dispatchEvent(new Event('change'));
        }
        updateCustomHeader();
        closeCustomDropdown();
    };

    container.appendChild(item);
}

function closeCustomDropdown() {
    const listElem = document.getElementById('customDropdownList');
    if (listElem) listElem.style.display = 'none';
}

function updateCustomHeader() {
    const selectElem = document.getElementById('effectSelect');
    const headerText = document.getElementById('headerText');
    const headerImg = document.getElementById('headerImg');
    if (!selectElem) return;

    const selectedOpt = selectElem.options[selectElem.selectedIndex];
    if (selectedOpt) {
        if (headerText) headerText.innerText = selectedOpt.innerText;

        if (selectedOpt.value === 'none') {
            if (headerImg) headerImg.style.display = 'none';
        } else {
            if (headerImg) {
                headerImg.src = `/2d-sim/img/${selectedOpt.value}.png`;
                headerImg.style.display = 'block';
                headerImg.onerror = () => headerImg.style.display = 'none';
            }
        }
    }
}

// Automatically close the dropdown when clicking outside its container
window.addEventListener('click', (e) => {
    const container = document.getElementById('customSelectionContainer');
    if (container && !container.contains(e.target)) {
        if (typeof closeCustomDropdown === 'function') closeCustomDropdown();
    }
});