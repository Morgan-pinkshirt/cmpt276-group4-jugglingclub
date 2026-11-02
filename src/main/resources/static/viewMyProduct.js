let scene, camera, renderer, currentMesh;

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

    //Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.DirectionalLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    //Oxyz Grid Helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    //Get Value from HTML form
    const typeElem = document.getElementById('productType');
    const colorElem = document.getElementById('productColor');
    const bodyColorElem = document.getElementById('bodyColor');
    
    const initialType = typeElem ? typeElem.value : 'ball';
    const initialColor = colorElem ? colorElem.value : '#ff5733';
    const initialBodyColor = bodyColorElem ? bodyColorElem.value : '#ffffff';
    
    createProduct(initialType, initialColor, initialBodyColor);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function createProduct(type, hexColor, hexBodyColor) {
    // 1. Safely dispose of old mesh/group completely
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
        currentMesh.name = 'handlePart'; // Bóng nhận màu theo ô Handle
    } else {
        // Create Club 
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

        // D. Top Cap
        const topPoints = [
            new THREE.Vector2(0.3, 1.6),
            new THREE.Vector2(0.32, 1.65),
            new THREE.Vector2(0.28, 1.72),
            new THREE.Vector2(0, 1.75)
        ];
        const topMesh = new THREE.Mesh(new THREE.LatheGeometry(topPoints, 32), blackMaterial);
        currentMesh.add(topMesh);

        // Rotate an angle for club 
        currentMesh.rotation.z = Math.PI / (6);
    }

    scene.add(currentMesh);
}

function updateProduct() {
    const type = document.getElementById('productType').value;
    const color = document.getElementById('productColor').value;
    const bodyColor = document.getElementById('bodyColor').value;
    createProduct(type, color, bodyColor);
}

// change color of handle
function updateColor() {
    const color = document.getElementById('productColor').value;
    if (currentMesh) {
        currentMesh.traverse((child) => {
            if (child.name === 'handlePart' && child.material) {
                child.material.color.set(color);
            }
        });
    }
}

// change color of the body
function updateBodyColor() {
    const color = document.getElementById('bodyColor').value;
    if (currentMesh) {
        currentMesh.traverse((child) => {
            if (child.name === 'bodyPart' && child.material) {
                child.material.color.set(color);
            }
        });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (currentMesh) {
        currentMesh.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

window.onload = init;