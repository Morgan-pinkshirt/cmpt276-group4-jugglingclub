

let scene, camera, renderer, currentMesh;

// Variables to track original selected hex colors and slider values
let originalHandleHex = '#ff5733';
let originalBodyHex = '#ffffff';
const effectSelect = document.getElementById('effectSelect');
// Interaction variables for mouse/touch dragging to rotate the object
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Effect Texture variables
let currentEffectTexture = null;
let selectedEffectName = effectSelect ? effectSelect.value : 'none';
const textureLoader = new THREE.TextureLoader();

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

    // Oxyz Grid Helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // Get initial values from HTML form elements
    const typeElem = document.getElementById('productType');
    const colorElem = document.getElementById('productColor');
    const bodyColorElem = document.getElementById('bodyColor');
    
    const initialType = typeElem ? typeElem.value : 'ball';
    originalHandleHex = colorElem ? colorElem.value : '#ff5733';
    originalBodyHex = bodyColorElem ? bodyColorElem.value : '#ffffff';
    
    createProduct(initialType, originalHandleHex, originalBodyHex);

    // Setup mouse and touch interaction for rotation
    setupInteraction(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

// Create or update the 3D product (Ball or Club)
function createProduct(type, hexColor, hexBodyColor) {
    // 1. Safely dispose of old mesh/group completely to free GPU memory
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        currentMesh = null;
    }

    if (type === 'ball') {
        const geometry = new THREE.SphereGeometry(1.2, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: hexColor, 
            roughness: 0.3, 
            metalness: 0.2 
        });
        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.name = 'handlePart'; // Ball reacts to handle color changes
    } else {
        // Create Juggling Club Group
        currentMesh = new THREE.Group();

        const handleMaterial = new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.3, metalness: 0.1 });
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: hexBodyColor, roughness: 0.3, metalness: 0.1 });
        const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.2 });

        // Knob
        const knobPoints = [
            new THREE.Vector2(0, -1.8),
            new THREE.Vector2(0.25, -1.75),
            new THREE.Vector2(0.3, -1.6),
            new THREE.Vector2(0.18, -1.5)
        ];
        const knobMesh = new THREE.Mesh(new THREE.LatheGeometry(knobPoints, 32), blackMaterial);
        currentMesh.add(knobMesh);

        // Handle
        const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 1.2, 32), handleMaterial);
        handleMesh.position.y = -0.9;
        handleMesh.name = 'handlePart'; 
        currentMesh.add(handleMesh);

        // Ring
        const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.1, 32), blackMaterial);
        ringMesh.position.y = -0.25;
        currentMesh.add(ringMesh);

        // Body 
        const bodyPath = new THREE.CubicBezierCurve(
            new THREE.Vector2(0.25, -0.2),
            new THREE.Vector2(0.65, 0.5),
            new THREE.Vector2(0.55, 1.2),
            new THREE.Vector2(0.3, 1.6)
        );
        const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(bodyPath.getPoints(20), 32), bodyMaterial);
        bodyMesh.name = 'bodyPart'; 
        currentMesh.add(bodyMesh);

        // Top Cap
        const topPoints = [
            new THREE.Vector2(0.3, 1.6),
            new THREE.Vector2(0.32, 1.65),
            new THREE.Vector2(0.28, 1.72),
            new THREE.Vector2(0, 1.75)
        ];
        const topMesh = new THREE.Mesh(new THREE.LatheGeometry(topPoints, 32), blackMaterial);
        currentMesh.add(topMesh);

        // Rotate at an angle for a dynamic club presentation
        currentMesh.rotation.z = Math.PI / 6;
    }

    scene.add(currentMesh);
    
    // Apply current effect or color & lighting settings
    if (selectedEffectName !== 'none') {
        // TODO make this run first
     
        updateEffect();
    } else {
        
        applyColorAndLighting();
    }
}

// Triggered when product type changes in HTML form
function updateProduct() {
    const type = document.getElementById('productType').value;
    originalHandleHex = document.getElementById('productColor').value;
    originalBodyHex = document.getElementById('bodyColor').value;
    createProduct(type, originalHandleHex, originalBodyHex);
}

// Triggered when handle color changes
function updateColor() {
    originalHandleHex = document.getElementById('productColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

// Triggered when body color changes
function updateBodyColor() {
    originalBodyHex = document.getElementById('bodyColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

// Triggered when brightness slider changes
function updateBrightness() {
    const brightnessInput = document.getElementById('brightnessRange');
    const brightnessValSpan = document.getElementById('brightnessVal');
    if (brightnessInput && brightnessValSpan) {
        brightnessValSpan.innerText = parseFloat(brightnessInput.value).toFixed(2);
    }
    if (selectedEffectName === 'none') applyColorAndLighting();
}

// Triggered when saturation slider changes
function updateSaturation() {
    const saturationInput = document.getElementById('saturationRange');
    const saturationValSpan = document.getElementById('saturationVal');
    if (saturationInput && saturationValSpan) {
        saturationValSpan.innerText = parseFloat(saturationInput.value).toFixed(2);
    }
    if (selectedEffectName === 'none') applyColorAndLighting();
}

// Triggered when selecting an effect from the effect-panel dropdown
function updateEffect() {
    selectedEffectName = effectSelect ? effectSelect.value : 'none';

    if (selectedEffectName === 'none') {
        currentEffectTexture = null;
        applyColorAndLighting();
    } else {
        const imagePath = `/img/${selectedEffectName}.png`;
        textureLoader.load(imagePath, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            currentEffectTexture = texture;
            applyEffectTexture();
        }, undefined, (err) => {
            console.warn(`Invalid file texture: ${imagePath}`, err);
        });
    }
}

// Apply selected effect texture map onto the 3D meshes
function applyEffectTexture() {
    if (!currentMesh || !currentEffectTexture) return;

    currentMesh.traverse((child) => {
        if (child.isMesh && child.material) {
            // Skip black accent parts (knob, ring, top cap) to keep them neutral
            if (child.material.color && child.material.color.getHex() === 0x111111) return;
            child.material.map = currentEffectTexture;
            child.material.color.set(0xffffff); // Reset tint to white so texture colors show correctly
            child.material.needsUpdate = true;
        }
    });
}

// Core function to calculate and apply color, brightness, and saturation via HSL
function applyColorAndLighting() {
    if (selectedEffectName !== 'none') return; // Skip if effect texture is active
    const brightnessInput = document.getElementById('brightnessRange');
    const saturationInput = document.getElementById('saturationRange');
    
    const brightness = brightnessInput ? parseFloat(brightnessInput.value) : 1.0;
    const saturation = saturationInput ? parseFloat(saturationInput.value) : 1.0;

    if (currentMesh) {
        currentMesh.traverse((child) => {
            if (child.material && child.material.color) {
                let baseHex = originalHandleHex;
                if (child.name === 'bodyPart') {
                    baseHex = originalBodyHex;
                } else if (child.material.color.getHex() === 0x111111) {
                    return; 
                }

                let color = new THREE.Color(baseHex);
                let hsl = {};
                color.getHSL(hsl);

                let newS = Math.min(Math.max(hsl.s * saturation, 0), 1);
                let newL = Math.min(Math.max(hsl.l * brightness, 0), 1);

                child.material.color.setHSL(hsl.h, newS, newL);
                child.material.map = null; // Clear texture map if returning to normal color mode
                child.material.needsUpdate = true;
            }
        });
    }
}

// Setup mouse and touch listeners for interactive 3D rotation
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

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Mobile touch support
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

    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// Handle window resizing to keep proportions correct
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop (auto-rotate and animate texture offset like the 2D canvas effect)
function animate() {
    requestAnimationFrame(animate);
    
    if (currentMesh) {
        if (!isDragging) {
            currentMesh.rotation.y += 0.01; // Auto-rotate 3D object
        }

        // If an effect texture is active, scroll its offset to mimic the spinning 2D canvas animation
        if (currentEffectTexture && selectedEffectName !== 'none') {
            currentEffectTexture.offset.y -= 0.02; // Speed of the effect animation loop
        }
    }
    
    renderer.render(scene, camera);
}

// Run initialization when window loads
window.onload = init;