// Global Three.js variables
let scene, camera, renderer, currentMesh;

// Variables to track original selected hex colors and slider values
let originalHandleHex = '#ff5733';
let originalBodyHex = '#ffffff';
let originalBallColorHex = '#ff5733';

// Interaction variables for mouse/touch dragging to rotate the object
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Effect Texture variables
let currentEffectTexture = null;
let selectedEffectName = 'none';
let effectAngle = 0; 
const textureLoader = new THREE.TextureLoader();

//Speed variables for rotation and effect animation
let rotationSpeed = 0.01; 
let effectSpeed = -0.005;

// Custom Shader Material (Polar Projection)
const customProjectorMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },
        uAngle: { value: 0.0 },
        uIsClub: { value: false },
        uOpacity: { value: 1.0 },
        uMeshOffsetY: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying float vHeightRatio;
        uniform float uMeshOffsetY;

        void main() {
            vUv = uv;
            
            float clubY = position.y + uMeshOffsetY;
            
            float minY = -1.8;
            float maxY = 1.75;
            
            vHeightRatio = clamp((clubY - minY) / (maxY - minY), 0.0, 1.0);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uAngle;
        uniform bool uIsClub;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vHeightRatio;

        void main() {
            float R_small = 0.18;
            float R_large = 0.45;
        
            float verticalFactor = uIsClub ? vHeightRatio : vUv.y;
            float r = R_small + verticalFactor * (R_large - R_small);

            float W_offset = (vUv.x - 0.5) * 0.0005; 
            float theta = uAngle + W_offset;

            vec2 pngUV;
            pngUV.x = 0.5 + r * cos(theta);
            pngUV.y = 0.5 + r * sin(theta);

            vec4 texColor = texture2D(uTexture, pngUV);
            if (pngUV.x < 0.0 || pngUV.x > 1.0 || pngUV.y < 0.0 || pngUV.y > 1.0) {
                texColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
            texColor.a *= uOpacity;

            gl_FragColor = texColor;
        }
    `,
    side: THREE.DoubleSide
});

const ringProjectorMaterial = customProjectorMaterial.clone();
ringProjectorMaterial.transparent = true;
ringProjectorMaterial.uniforms.uOpacity.value = 0.7;

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
    const ballColorElem = document.getElementById('ballColor');

    const initialType = typeElem ? typeElem.value : 'ball';
    originalHandleHex = colorElem ? colorElem.value : '#ff5733';
    originalBodyHex = bodyColorElem ? bodyColorElem.value : '#ffffff';
    originalBallColorHex = ballColorElem ? ballColorElem.value : '#ff5733';

    toggleProductUI(initialType);
    createProduct(initialType, originalHandleHex, originalBodyHex, originalBallColorHex);

    // Setup mouse and touch interaction for rotation
    setupInteraction(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

// Create or update the 3D product (Ball or Club)
function createProduct(type, hexColor, hexBodyColor, hexBallColor) {
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
            color: hexBallColor || originalBallColorHex, 
            roughness: 0.3, 
            metalness: 0.2 
        });
        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.name = 'ballPart'; 
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

        // 1. Handle
        const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 1.2, 32), handleMaterial);
        handleMesh.position.y = -0.9;
        handleMesh.name = 'handlePart'; 
        currentMesh.add(handleMesh);

        // 2. Ring
        const translucentRingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.2, 
            metalness: 0.3, 
            transparent: true, 
            opacity: 0.7 
        });
        const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.08, 32), translucentRingMaterial);
        ringMesh.position.y = -0.25;
        ringMesh.name = 'ringPart'; 
        currentMesh.add(ringMesh);

        // 3. Body
        const bodyPath = new THREE.CubicBezierCurve(
            new THREE.Vector2(0.23, -0.2), 
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

        currentMesh.rotation.z = Math.PI / 6;
    }

    scene.add(currentMesh);
    
    if (selectedEffectName !== 'none') {
        applyEffectTexture();
    } else {
        applyColorAndLighting();
    }
}

function updateProduct() {
    const type = document.getElementById('productType').value;
    toggleProductUI(type);
    originalHandleHex = document.getElementById('productColor').value;
    originalBodyHex = document.getElementById('bodyColor').value;
    originalBallColorHex = document.getElementById('ballColor').value;
    createProduct(type, originalHandleHex, originalBodyHex, originalBallColorHex);
}

function toggleProductUI(type) {
    const clubOptions = document.getElementById('clubColorOptions');
    const ballOptions = document.getElementById('ballColorOptions');

    if (type === 'ball') {
        if (ballOptions) ballOptions.classList.remove('hidden');
        if (clubOptions) clubOptions.classList.add('hidden');
    } else {
        if (ballOptions) ballOptions.classList.add('hidden');
        if (clubOptions) clubOptions.classList.remove('hidden');
    }
}

function updateBallColor() {
    originalBallColorHex = document.getElementById('ballColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function updateHandleColor() {
    originalHandleHex = document.getElementById('productColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function updateBodyColor() {
    originalBodyHex = document.getElementById('bodyColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function updateBrightness() {
    const brightnessInput = document.getElementById('brightnessRange');
    const brightnessValSpan = document.getElementById('brightnessVal');
    if (brightnessInput && brightnessValSpan) {
        brightnessValSpan.innerText = parseFloat(brightnessInput.value).toFixed(2);
    }
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function updateSaturation() {
    const saturationInput = document.getElementById('saturationRange');
    const saturationValSpan = document.getElementById('saturationVal');
    if (saturationInput && saturationValSpan) {
        saturationValSpan.innerText = parseFloat(saturationInput.value).toFixed(2);
    }
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function updateEffect() {
    const effectSelect = document.getElementById('effectSelect');
    selectedEffectName = effectSelect ? effectSelect.value : 'none';

    if (selectedEffectName === 'none') {
        currentEffectTexture = null;
        resetToStandardMaterial();
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

function resetToStandardMaterial() {
    if (!currentMesh) return;

    const translucentBlackMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.2, 
        metalness: 0.3, 
        transparent: true, 
        opacity: 0.6 
    });

    const ballMaterial = new THREE.MeshStandardMaterial({ color: originalBallColorHex, roughness: 0.3, metalness: 0.2 });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: originalHandleHex, roughness: 0.3, metalness: 0.1 });
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: originalBodyHex, roughness: 0.3, metalness: 0.1 });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.2 });

    currentMesh.traverse((child) => {
        if (child.isMesh) {
            if (child.name === 'ballPart') {
                child.material = ballMaterial;
            } else if (child.name === 'handlePart') {
                child.material = handleMaterial;
            } else if (child.name === 'bodyPart') {
                child.material = bodyMaterial;
            } else if (child.name === 'ringPart'){
                child.material = translucentBlackMaterial;
            } else {
                child.material = blackMaterial;
            }
        }
    });
}

// Apply selected effect texture map onto the 3D meshes using Projection Mapping logic
function applyEffectTexture() {
    if (!currentMesh || !currentEffectTexture) return;
    const isClub = (document.getElementById('productType').value === 'club');
    currentMesh.traverse((child) => {
        if (!child.isMesh) return;
        const isRing = child.name === 'ringPart';
        const isTarget = isRing || child.name === 'handlePart' || 
                         child.name === 'bodyPart' || child.name === 'ballPart';
        if (!isTarget) return;
        if (child.material && child.material !== customProjectorMaterial && child.material !== ringProjectorMaterial) {
            child.material.dispose();
        }
        const mat = (isRing ? ringProjectorMaterial : customProjectorMaterial).clone();
        mat.uniforms = THREE.UniformsUtils.clone(mat.uniforms);
        
        mat.transparent = isRing;
        mat.uniforms.uTexture.value = currentEffectTexture;
        mat.uniforms.uIsClub.value = isClub;
        mat.uniforms.uOpacity.value = isRing ? 0.7 : 1.0;
        mat.uniforms.uMeshOffsetY.value = isClub ? child.position.y : 0.0;
        mat.needsUpdate = true;

        child.material = mat;
    });
}

function applyColorAndLighting() {
    if (selectedEffectName !== 'none') return;

    const brightnessInput = document.getElementById('brightnessRange');
    const saturationInput = document.getElementById('saturationRange');
    
    const brightness = brightnessInput ? parseFloat(brightnessInput.value) : 1.0;
    const saturation = saturationInput ? parseFloat(saturationInput.value) : 1.0;

    const type = document.getElementById('productType').value;

    if (currentMesh) {
        if (type === 'ball') {
            let color = new THREE.Color(originalBallColorHex);
            let hsl = {};
            color.getHSL(hsl);
            let newS = Math.min(Math.max(hsl.s * saturation, 0), 1);
            let newL = Math.min(Math.max(hsl.l * brightness, 0), 1);
            currentMesh.material.color.setHSL(hsl.h, newS, newL);
            currentMesh.material.map = null;
            currentMesh.material.needsUpdate = true;
        } else {
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
                    child.material.map = null;
                    child.material.needsUpdate = true;
                }
            });
        }
    }
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
    effectSpeed = -0.005 * multiplier;

    //Speed button UI update
    [1, 2, 4].forEach(m => {
        const btn = document.getElementById(`btn-speed-${m}`);
        if (btn) {
            if (m === multiplier) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
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

window.onload = init;