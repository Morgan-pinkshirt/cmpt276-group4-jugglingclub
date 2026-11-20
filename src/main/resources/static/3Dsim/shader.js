// Effect Texture variables
let currentEffectTexture = null;
let selectedEffectName = 'none';
let effectAngle = 0;
const textureLoader = new THREE.TextureLoader();

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

function updateEffect() {
    const effectSelect = document.getElementById('effectSelect');
    selectedEffectName = effectSelect ? effectSelect.value : 'none';

    if (selectedEffectName === 'none') {
        currentEffectTexture = null;
        resetToStandardMaterial();
        applyColorAndLighting();
    } else {
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
            } else if (child.name === 'ringPart') {
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
        if (child.material
            && child.material !== customProjectorMaterial
            && child.material !== ringProjectorMaterial) {
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
