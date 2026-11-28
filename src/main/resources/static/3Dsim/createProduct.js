// Create or update the 3D product (Ball or Club)
function createProduct(type, hexColor, hexBodyColor, hexBallColor, staffOptions = {}) {
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
    } else if (type === 'staff') {
        // Create Staff Group with 2 knobs (knob1 at bottom, knob2 at top)
        currentMesh = new THREE.Group();
        currentMesh.name = 'staffGroup';

        const colorKnob1 = staffOptions.colorKnob1 || document.getElementById('knob1Color')?.value || '#222222';
        const colorKnob2 = staffOptions.colorKnob2 || document.getElementById('knob2Color')?.value || '#222222';
        const colorStaff = staffOptions.colorStaff || document.getElementById('staffColor')?.value || hexBodyColor || hexColor || '#cccccc';
        const knobType = staffOptions.knobType || document.getElementById('knobType')?.value || 'ball';

        const staffLength = 2.8;
        const staffRadius = 0.08;
        const halfLen = staffLength / 2; // 1.4

        const knob1Material = new THREE.MeshStandardMaterial({
            color: colorKnob1,
            roughness: 0.3,
            metalness: 0.2
        });
        const staffMaterial = new THREE.MeshStandardMaterial({
            color: colorStaff,
            roughness: 0.3,
            metalness: 0.15
        });
        const knob2Material = new THREE.MeshStandardMaterial({
            color: colorKnob2,
            roughness: 0.3,
            metalness: 0.2
        });

        // 1. Staff shaft
        const staffMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(staffRadius, staffRadius, staffLength, 32),
            staffMaterial
        );
        staffMesh.name = 'staffPart';
        currentMesh.add(staffMesh);

        // 2. Knob 1 & Knob 2 ('ball' or 'cylinder')
        let knob1Geo, knob2Geo, knob1Y, knob2Y, startY, endY;

        if (knobType === 'cylinder') {
            const knobRadius = 0.20;
            const knobHeight = 0.45;
            knob1Geo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobHeight, 32);
            knob2Geo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobHeight, 32);
            knob1Y = -halfLen - knobHeight / 2;
            knob2Y = halfLen + knobHeight / 2;
            startY = knob1Y - knobHeight / 2;
            endY = knob2Y + knobHeight / 2;
        } else {
            const knobRadius = 0.28;
            knob1Geo = new THREE.SphereGeometry(knobRadius, 32, 32);
            knob2Geo = new THREE.SphereGeometry(knobRadius, 32, 32);
            knob1Y = -halfLen - knobRadius * 0.65;
            knob2Y = halfLen + knobRadius * 0.65;
            startY = knob1Y - knobRadius;
            endY = knob2Y + knobRadius;
        }

        const knob1Mesh = new THREE.Mesh(knob1Geo, knob1Material);
        knob1Mesh.position.y = knob1Y;
        knob1Mesh.name = 'knob1Part';
        currentMesh.add(knob1Mesh);

        const knob2Mesh = new THREE.Mesh(knob2Geo, knob2Material);
        knob2Mesh.position.y = knob2Y;
        knob2Mesh.name = 'knob2Part';
        currentMesh.add(knob2Mesh);

        currentMesh.userData.staffSpan = { startY, endY };
        currentMesh.userData.staffColors = { colorKnob1, colorKnob2, colorStaff };
        currentMesh.userData.knobType = knobType;

        currentMesh.rotation.z = Math.PI / 6;

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
    //update club
    originalHandleHex = document.getElementById('productColor').value;
    originalBodyHex = document.getElementById('bodyColor').value;
    //update ball
    originalBallColorHex = document.getElementById('ballColor').value;
    // update staff
    const staffOptions = {
        colorKnob1: document.getElementById('knob1Color')?.value || '#222222',
        colorKnob2: document.getElementById('knob2Color')?.value || '#222222',
        colorStaff: document.getElementById('staffColor')?.value || '#cccccc',
        knobType: document.getElementById('knobType')?.value || 'ball'
    };
    createProduct(type, originalHandleHex, originalBodyHex, originalBallColorHex, staffOptions);
}

function updateStaffProduct() {
    if (document.getElementById('productType')?.value !== 'staff') return;

    const colorKnob1 = document.getElementById('knob1Color')?.value || '#222222';
    const colorKnob2 = document.getElementById('knob2Color')?.value || '#222222';
    const colorStaff = document.getElementById('staffColor')?.value || '#cccccc';
    const knobType = document.getElementById('knobType')?.value || 'ball';

    const prevKnobType = currentMesh?.userData?.knobType;

    // Chưa có mesh, hoặc đổi kiểu knob => tạo lại
    if (!currentMesh || prevKnobType !== knobType) {
        createProduct('staff', originalHandleHex, originalBodyHex, originalBallColorHex, {
            colorKnob1, colorKnob2, colorStaff, knobType
        });
        return; // createProduct đã tự gọi applyEffectTexture / applyColorAndLighting
    }

    currentMesh.userData.staffColors = { colorKnob1, colorKnob2, colorStaff };

    if (selectedEffectName === 'none') {
        applyColorAndLighting();
    } else {
        applyEffectTexture();
    }
}

function toggleProductUI(type) {
    const clubOptions = document.getElementById('clubColorOptions');
    const ballOptions = document.getElementById('ballColorOptions');
    const staffOptions = document.getElementById('staffColorOptions');

    if (ballOptions) ballOptions.classList.toggle('hidden', type !== 'ball');
    if (clubOptions) clubOptions.classList.toggle('hidden', type !== 'club');
    if (staffOptions) staffOptions.classList.toggle('hidden', type !== 'staff');
}

function updateBallColor() {
    originalBallColorHex = document.getElementById('ballColor').value;
    if (selectedEffectName === 'none') applyColorAndLighting();
}

function setStaffPartColor(partName, colorKey, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const hexColor = input.value;
    if (!currentMesh || !currentMesh.userData) return;

    currentMesh.userData.staffColors = currentMesh.userData.staffColors || {};
    currentMesh.userData.staffColors[colorKey] = hexColor;

    if (selectedEffectName !== 'none') {
        // Nếu đang bật shader effect thì áp dụng lại texture/effect thay vì set .color trên ShaderMaterial
        if (typeof applyEffectTexture === 'function') {
            applyEffectTexture();
        }
        return;
    }

    const part = currentMesh.getObjectByName(partName);
    if (part && part.material && part.material.color) {
        part.material.color.set(hexColor);
        part.material.needsUpdate = true;
    }

    if (typeof applyColorAndLighting === 'function') {
        applyColorAndLighting();
    }
}

function updateKnob1Color() {
    setStaffPartColor('knob1Part', 'colorKnob1', 'knob1Color');
}

function updateKnob2Color() {
    setStaffPartColor('knob2Part', 'colorKnob2', 'knob2Color');
}

function updateStaffColor() {
    setStaffPartColor('staffPart', 'colorStaff', 'staffColor');
}

function syncKnob2ToKnob1() {
    const knob1Input = document.getElementById('knob1Color');
    const knob2Input = document.getElementById('knob2Color');
    if (!knob1Input || !knob2Input) return;

    knob2Input.value = knob1Input.value;
    updateKnob2Color();
}

function updateStaffProduct() {
    if (!currentMesh || document.getElementById('productType')?.value !== 'staff') return;

    const colorKnob1 = document.getElementById('knob1Color')?.value || '#222222';
    const colorKnob2 = document.getElementById('knob2Color')?.value || '#222222';
    const colorStaff = document.getElementById('staffColor')?.value || '#cccccc';
    const knobType = document.getElementById('knobType')?.value || 'ball';

    const prevKnobType = currentMesh.userData?.knobType;
    currentMesh.userData.staffColors = { colorKnob1, colorKnob2, colorStaff };
    currentMesh.userData.knobType = knobType;

    if (prevKnobType && prevKnobType !== knobType) {
        createProduct('staff', originalHandleHex, originalBodyHex, originalBallColorHex, {
            colorKnob1,
            colorKnob2,
            colorStaff,
            knobType
        });
        if (selectedEffectName !== 'none') {
            applyEffectTexture();
        } else {
            applyColorAndLighting();
        }
        return;
    }

    if (selectedEffectName === 'none') {
        applyColorAndLighting();
    } else {
        applyEffectTexture();
    }
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
            const staffColors = currentMesh.userData?.staffColors || {};

            // Traverse all child meshes in the group (club or staff) to apply brightness and saturation
            currentMesh.traverse((child) => {
                // Only process meshes whose material supports a .color property
                if (child.material && child.material.color) {
                    let baseHex = null;

                    if (type === 'staff') {
                        // Resolve the base color for each part of the staff
                        if (child.name === 'knob1Part') {
                            baseHex = staffColors.colorKnob1 ?? document.getElementById('knob1Color')?.value ?? '#222222';
                        } else if (child.name === 'knob2Part') {
                            baseHex = staffColors.colorKnob2 ?? document.getElementById('knob2Color')?.value ?? '#222222';
                        } else if (child.name === 'staffPart') {
                            baseHex = staffColors.colorStaff ?? document.getElementById('staffColor')?.value ?? '#cccccc';
                        } else {
                            // Skip unrecognized child meshes
                            return;
                        }
                    } else {
                        // Club branch: separate bodyPart, fixed dark accents (0x111111), and handlePart
                        if (child.name === 'bodyPart') {
                            baseHex = originalBodyHex;
                        } else if (child.material.color.getHex() === 0x111111) {
                            // Leave default dark accents (such as black caps/knobs/rings) unchanged
                            return;
                        } else {
                            baseHex = originalHandleHex;
                        }
                    }

                    // Convert base color to HSL so Saturation (S) and Lightness/Brightness (L) can be adjusted
                    const color = new THREE.Color(baseHex);
                    const hsl = {};
                    color.getHSL(hsl);

                    // Clamp S and L to [0, 1] to prevent color clipping or over-brightening
                    const newS = Math.min(Math.max(hsl.s * saturation, 0), 1);
                    const newL = Math.min(Math.max(hsl.l * brightness, 0), 1);

                    // Apply updated HSL color and clear any diffuse texture map
                    child.material.color.setHSL(hsl.h, newS, newL);
                    child.material.map = null;
                    child.material.needsUpdate = true;
                }
            });
        }
    }
}