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
