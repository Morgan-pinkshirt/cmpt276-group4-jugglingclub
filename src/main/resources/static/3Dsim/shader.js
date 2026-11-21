// Effect texture state and loader
let currentEffectTexture = null;
let selectedEffectName = 'none';
let effectAngle = 0;
const textureLoader = new THREE.TextureLoader();

// Custom ShaderMaterial using polar projection mapping across the product's height
const customProjectorMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },       // Effect PNG texture
        uAngle: { value: 0.0 },         // Current rotation angle around the polar center
        uIsClub: { value: false },      // Enables height-based mapping (used for both club and staff)
        uOpacity: { value: 1.0 },       // Material alpha multiplier
        uMeshOffsetY: { value: 0.0 },   // Local Y offset of the child mesh within its parent group
        uMinY: { value: -1.8 },         // Bottom bound along the vertical axis (0.0 ratio)
        uMaxY: { value: 1.75 }          // Top bound along the vertical axis (1.0 ratio)
    },
    vertexShader: `
        varying vec2 vUv;
        varying float vHeightRatio;
        uniform float uMeshOffsetY;
        uniform float uMinY;
        uniform float uMaxY;

        void main() {
            // Pass standard mesh UVs to the fragment shader
            vUv = uv;

            // Shift local vertex Y by the child mesh's Y offset so multi-part meshes share one vertical axis
            float worldLocalY = position.y + uMeshOffsetY;

            // Normalize vertical position into [0.0, 1.0] across [uMinY, uMaxY] (knob1 -> staff -> knob2)
            float span = max(uMaxY - uMinY, 0.0001);
            vHeightRatio = clamp((worldLocalY - uMinY) / span, 0.0, 1.0);

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
            // Radial bounds in the circular PNG texture
            float R_small = 0.18;
            float R_large = 0.45;

            // Use normalized height ratio for club/staff so the effect flows seamlessly across all parts
            float verticalFactor = uIsClub ? vHeightRatio : vUv.y;
            float r = R_small + verticalFactor * (R_large - R_small);

            // Slight angular offset across horizontal UV and global rotation angle
            float W_offset = (vUv.x - 0.5) * 0.0005;
            float theta = uAngle + W_offset;

            // Convert polar coordinates (r, theta) to normalized texture UV coordinates
            vec2 pngUV;
            pngUV.x = 0.5 + r * cos(theta);
            pngUV.y = 0.5 + r * sin(theta);

            // Sample texture and fall back to solid black outside valid [0, 1] UV bounds
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

// Cloned projector material configured for semi-transparent ring parts
const ringProjectorMaterial = customProjectorMaterial.clone();
ringProjectorMaterial.transparent = true;
ringProjectorMaterial.uniforms.uOpacity.value = 0.7;

// Load or clear the selected effect texture when the dropdown changes
function updateEffect() {
    const effectSelect = document.getElementById('effectSelect');
    selectedEffectName = effectSelect ? effectSelect.value : 'none';

    if (selectedEffectName === 'none') {
        // Revert back to solid base colors and lighting adjustments
        currentEffectTexture = null;
        resetToStandardMaterial();
        applyColorAndLighting();
    } else {
        // Load the PNG texture for the chosen effect pattern
        const imagePath = `/2d-sim/img/${selectedEffectName}.png`;
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

// Restore standard MeshStandardMaterial colors for each part of ball, club, or staff
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

    // Resolve saved staff colors so knob1, knob2, and staff keep their individual base colors
    const staffColors = currentMesh.userData?.staffColors || {};
    const knob1Material = new THREE.MeshStandardMaterial({
        color: staffColors.colorKnob1 ?? document.getElementById('knob1Color')?.value ?? '#222222',
        roughness: 0.3,
        metalness: 0.2
    });
    const knob2Material = new THREE.MeshStandardMaterial({
        color: staffColors.colorKnob2 ?? document.getElementById('knob2Color')?.value ?? '#222222',
        roughness: 0.3,
        metalness: 0.2
    });
    const staffMaterial = new THREE.MeshStandardMaterial({
        color: staffColors.colorStaff ?? document.getElementById('staffColor')?.value ?? '#cccccc',
        roughness: 0.3,
        metalness: 0.15
    });

    // Assign the matching material to each child mesh
    currentMesh.traverse((child) => {
        if (child.isMesh) {
            if (child.name === 'ballPart') {
                child.material = ballMaterial;
            } else if (child.name === 'handlePart') {
                child.material = handleMaterial;
            } else if (child.name === 'bodyPart') {
                child.material = bodyMaterial;
            } else if (child.name === 'ringPart') {
                child.material = translucentBlackMaterial;
            } else if (child.name === 'knob1Part') {
                child.material = knob1Material;
            } else if (child.name === 'knob2Part') {
                child.material = knob2Material;
            } else if (child.name === 'staffPart') {
                child.material = staffMaterial;
            } else {
                child.material = blackMaterial;
            }
        }
    });
}

// Apply the polar projection effect shader across target meshes
function applyEffectTexture() {
    if (!currentMesh || !currentEffectTexture) return;

    const productType = document.getElementById('productType')?.value;
    const isClub = productType === 'club';
    const isStaff = productType === 'staff';
    const useHeightSpan = isClub || isStaff;

    // Default vertical bounds for club; override with full knob1-to-knob2 span for staff
    let minY = -1.8;
    let maxY = 1.75;

    if (isStaff && currentMesh.userData?.staffSpan) {
        minY = currentMesh.userData.staffSpan.startY;
        maxY = currentMesh.userData.staffSpan.endY;
    }

    currentMesh.traverse((child) => {
        if (!child.isMesh) return;

        const isRing = child.name === 'ringPart';
        const isTarget =
            isRing ||
            child.name === 'handlePart' ||
            child.name === 'bodyPart' ||
            child.name === 'ballPart' ||
            child.name === 'knob1Part' ||
            child.name === 'staffPart' ||
            child.name === 'knob2Part';

        if (!isTarget) return;

        // Dispose non-shared previous materials to avoid GPU memory leaks
        if (
            child.material &&
            child.material !== customProjectorMaterial &&
            child.material !== ringProjectorMaterial
        ) {
            child.material.dispose();
        }

        // Clone shader material and uniforms per mesh so offsets and opacity stay isolated
        const mat = (isRing ? ringProjectorMaterial : customProjectorMaterial).clone();
        mat.uniforms = THREE.UniformsUtils.clone(mat.uniforms);

        mat.transparent = isRing;
        mat.uniforms.uTexture.value = currentEffectTexture;
        mat.uniforms.uIsClub.value = useHeightSpan;
        mat.uniforms.uOpacity.value = isRing ? 0.7 : 1.0;
        mat.uniforms.uMeshOffsetY.value = useHeightSpan ? child.position.y : 0.0;
        mat.uniforms.uMinY.value = minY;
        mat.uniforms.uMaxY.value = maxY;
        mat.needsUpdate = true;

        child.material = mat;
    });
}