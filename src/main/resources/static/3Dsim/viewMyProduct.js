// Global Three.js variables
let scene, camera, renderer, currentMesh;

// Variables to track original selected hex colors and slider values
let originalHandleHex = '#ff5733';
let originalBodyHex = '#ffffff';
let originalBallColorHex = '#ff5733';

// Interaction variables for mouse/touch dragging to rotate the object
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

//Speed variables for rotation and effect animation
let rotationSpeed = 0.01;
let effectSpeed = -0.005;
const speedSteps = [0.1, 0.25, 0.5, 1, 2, 4];
let currentSpeedIndex = 3;

// Initialize the 3D scene, camera, renderer, lights, and event listeners
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // Setup Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.DirectionalLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Get initial values from HTML form elements
    const typeElem = document.getElementById('productType');
    const colorElem = document.getElementById('productColor');
    const bodyColorElem = document.getElementById('bodyColor');
    const ballColorElem = document.getElementById('ballColor');
    const knob1ColorElem = document.getElementById('knob1Color');
    const knob2ColorElem = document.getElementById('knob2Color');
    const staffColorElem = document.getElementById('staffColor');
    const knobTypeElem = document.getElementById('knobType');
    const initialType = typeElem ? typeElem.value : 'ball';

    originalHandleHex = colorElem ? colorElem.value : '#ff5733';
    originalBodyHex = bodyColorElem ? bodyColorElem.value : '#ffffff';
    originalBallColorHex = ballColorElem ? ballColorElem.value : '#ff5733';
    const initialStaffOptions = {
        colorKnob1: knob1ColorElem ? knob1ColorElem.value : '#222222',
        colorKnob2: knob2ColorElem ? knob2ColorElem.value : '#222222',
        colorStaff: staffColorElem ? staffColorElem.value : '#cccccc',
        knobType: knobTypeElem ? knobTypeElem.value : 'ball'
    };
    toggleProductUI(initialType);
    createProduct(
        initialType,
        originalHandleHex,
        originalBodyHex,
        originalBallColorHex,
        initialStaffOptions
    );

    const effectSelect = document.getElementById('effectSelect');
    if (effectSelect && effectSelect.value !== 'none') {
        updateEffect();
    }

    setupInteraction(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function setupInteraction(domElement) {
    domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentMesh) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        currentMesh.rotation.y += deltaX * 0.01;
        currentMesh.rotation.x += deltaY * 0.01;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || !currentMesh || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        currentMesh.rotation.y += deltaX * 0.01;
        currentMesh.rotation.x += deltaY * 0.01;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', () => { isDragging = false; });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// function to set the speed of rotation and effect animation based on user selection
function setSpeed(multiplier) {
    const idx = speedSteps.indexOf(multiplier);
    if (idx !== -1) {
        currentSpeedIndex = idx;
    }
    effectSpeed = -0.005 * multiplier;

    const display = document.getElementById('speedDisplay');
    if (display) {
        display.innerText = multiplier + 'x';
    }
}

function adjustSpeed(direction) {
    currentSpeedIndex += direction;
    if (currentSpeedIndex < 0) currentSpeedIndex = 0;
    if (currentSpeedIndex >= speedSteps.length) currentSpeedIndex = speedSteps.length - 1;

    setSpeed(speedSteps[currentSpeedIndex]);
}

// function to set the default rotation of the product based on user selection
function setDefaultRotation(type) {
    if (!currentMesh) return;

    isDragging = false; // stop any ongoing dragging rotation

    if (type === 'pi_2') {
        //Standing view
        currentMesh.rotation.x = 0;
        currentMesh.rotation.y = Math.PI / 2;
        currentMesh.rotation.z = 0;
    } else if (type === 'pi_6') {
        //Side view
        currentMesh.rotation.x = 0;
        currentMesh.rotation.y = Math.PI / 6;
        currentMesh.rotation.z = Math.PI / 6;
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (currentMesh) {
        if (!isDragging) {
            currentMesh.rotation.y += rotationSpeed;
        }
        if (selectedEffectName !== 'none') {
            effectAngle += effectSpeed;
            customProjectorMaterial.uniforms.uAngle.value = effectAngle;
            ringProjectorMaterial.uniforms.uAngle.value = effectAngle;
            currentMesh.traverse((child) => {
                if (child.isMesh && child.material && child.material.uniforms &&
                    child.material.uniforms.uAngle) {
                    child.material.uniforms.uAngle.value = effectAngle;
                }
            });
        }
    }
    renderer.render(scene, camera);
}

// Build the 3D scene and restore state in the correct chronological order
document.addEventListener('DOMContentLoaded', () => {
    init();
    initCustomDropdown();
    if (typeof restoreFromSessionStorage === 'function') {
        restoreFromSessionStorage();
    }
    if (typeof updateCustomHeader === 'function') {
        updateCustomHeader();
    }
});

const PENDING_TARGET_KEY = 'synchroPendingMomentTarget';
const MOMENT_RESULT_KEY = 'synchroMomentDesignResult';
const TEMP_SELECTION_KEY = 'tempSelection';
const SYNCHRO_DRAFT_KEY = 'synchroMomentsDraft';

function collectCurrent3DOptions() {
    const productType = document.getElementById('productType')?.value || 'club';
    const productColor = document.getElementById('productColor')?.value || '#ffffff';
    const bodyColor = document.getElementById('bodyColor')?.value || '#ffffff';
    const ballColor = document.getElementById('ballColor')?.value || productColor;
    const brightness = parseFloat(document.getElementById('brightnessRange')?.value ?? '1');
    const saturation = parseFloat(document.getElementById('saturationRange')?.value ?? '1');
    const knobType = document.getElementById('knobType')?.value || 'ball';
    const colorKnob1 = document.getElementById('knob1Color')?.value || '#222222';
    const colorKnob2 = document.getElementById('knob2Color')?.value || '#222222';
    const colorStaff = document.getElementById('staffColor')?.value || bodyColor || '#cccccc';
    const effect = typeof selectedEffectName === 'string' ? selectedEffectName : 'none';

    return {
        productType,
        productColor: productType === 'ball' ? ballColor : productColor,
        bodyColor,
        ballColor,
        brightness: Number.isFinite(brightness) ? brightness : 1.0,
        saturation: Number.isFinite(saturation) ? saturation : 1.0,
        knobType,
        colorKnob1,
        colorKnob2,
        colorStaff,
        effect
    };
}

function handleSaveToMoment() {
    let targetMeta = null;
    try {
        targetMeta = JSON.parse(sessionStorage.getItem(PENDING_TARGET_KEY) || 'null');
    } catch {
        targetMeta = null;
    }

    const options = collectCurrent3DOptions();

    // Giữ bản tạm để khi redirect / quay lại mọi thay đổi vẫn còn
    sessionStorage.setItem(TEMP_SELECTION_KEY, JSON.stringify(options));

    if (targetMeta && targetMeta.momentId) {
        const resultPayload = {
            momentId: targetMeta.momentId,
            options,
            savedAt: Date.now()
        };
        sessionStorage.setItem(MOMENT_RESULT_KEY, JSON.stringify(resultPayload));

        // Cập nhật thẳng vào draft hiện có (nếu có) để moment không bao giờ mất
        try {
            const rawDraft = sessionStorage.getItem(SYNCHRO_DRAFT_KEY);
            if (rawDraft) {
                const draft = JSON.parse(rawDraft);
                if (draft && Array.isArray(draft.moments)) {
                    draft.moments = draft.moments.map((m) =>
                        m.id === targetMeta.momentId
                            ? { ...m, options: { ...(m.options || {}), ...options } }
                            : m
                    );
                    draft.selectedMomentId = targetMeta.momentId;
                    sessionStorage.setItem(SYNCHRO_DRAFT_KEY, JSON.stringify(draft));
                }
            }
        } catch (err) {
            console.error('Failed to sync draft before redirect:', err);
        }

        sessionStorage.removeItem(PENDING_TARGET_KEY);
    }

    const returnUrl = targetMeta?.returnUrl || 'synchro.html';
    window.location.href = returnUrl;
}

function initSaveToMomentButton() {
    const btn = document.getElementById('btnSaveToMoment');
    if (!btn) return;

    let hasPendingMoment = false;
    try {
        const raw = sessionStorage.getItem(PENDING_TARGET_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        hasPendingMoment = Boolean(parsed && parsed.momentId);
    } catch {
        hasPendingMoment = false;
    }

    btn.classList.toggle('hidden', !hasPendingMoment);
    btn.style.display = hasPendingMoment ? '' : 'none';
    btn.addEventListener('click', handleSaveToMoment);
}
window.applyMomentOptions = function (options = {}) {
    const typeSelect = document.getElementById('productType');
    const currentType = typeSelect?.value || 'club';
    const nextType = options.productType || currentType;

    const handleColor = options.handleColor || options.productColor || originalHandleHex;
    const bodyColor = options.bodyColor || originalBodyHex;
    const ballColor = options.ballColor || originalBallColorHex;

    let brightness = options.brightness !== undefined ? Number(options.brightness) : 1;
    if (brightness > 2) brightness = brightness / 100;

    let saturation = options.saturation !== undefined ? Number(options.saturation) : 1;
    if (saturation > 2) saturation = saturation / 100;

    const nextEffect = options.effect || 'none';

    originalHandleHex = handleColor;
    originalBodyHex = bodyColor;
    originalBallColorHex = ballColor;

    const handleInput = document.getElementById('productColor');
    const bodyInput = document.getElementById('bodyColor');
    const ballInput = document.getElementById('ballColor');
    const brightInput = document.getElementById('brightnessRange');
    const satInput = document.getElementById('saturationRange');
    const effectSelect = document.getElementById('effectSelect');

    if (handleInput) handleInput.value = handleColor;
    if (bodyInput) bodyInput.value = bodyColor;
    if (ballInput) ballInput.value = ballColor;
    if (brightInput) brightInput.value = brightness;
    if (satInput) satInput.value = saturation;
    if (effectSelect) effectSelect.value = nextEffect;

    if (typeSelect && typeSelect.value !== nextType) {
        typeSelect.value = nextType;
        if (typeof toggleProductUI === 'function') toggleProductUI(nextType);
        if (typeof createProduct === 'function') {
            createProduct(nextType, originalHandleHex, originalBodyHex, originalBallColorHex);
        }
    }

    if (typeof updateBrightness === 'function') updateBrightness();
    if (typeof updateSaturation === 'function') updateSaturation();

    if (nextEffect === 'none') {
        selectedEffectName = 'none';
        currentEffectTexture = null;
        if (typeof resetToStandardMaterial === 'function') resetToStandardMaterial();
        if (typeof applyColorAndLighting === 'function') applyColorAndLighting();
        if (typeof updateCustomHeader === 'function') updateCustomHeader();
    } else if (selectedEffectName !== nextEffect || !currentEffectTexture) {
        if (typeof updateEffect === 'function') updateEffect();
        if (typeof updateCustomHeader === 'function') updateCustomHeader();
    } else {
        if (typeof applyEffectTexture === 'function') applyEffectTexture();
        if (typeof updateCustomHeader === 'function') updateCustomHeader();
    }
};