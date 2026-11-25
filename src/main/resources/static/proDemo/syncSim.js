(function () {
    const PENDING_TARGET_KEY = 'synchroPendingMomentTarget';
    const TEMP_SELECTION_KEY = 'tempSelection';

    const DEFAULT_OPTIONS = {
        productType: 'club',
        productColor: '#ff5733',
        bodyColor: '#ffffff',
        ballColor: '#ff5733',
        brightness: 1.0,
        saturation: 1.0,
        effect: 'none'
    };

    const viewport = document.getElementById('synchro-viewport');
    let scene = null;
    let camera = null;
    let renderer = null;
    let activeGroup = null;
    let currentProductType = null;
    let currentOptions = { ...DEFAULT_OPTIONS };
    let rafId = null;

    function normalizeFactor(val, fallback = 1.0) {
        const num = Number(val);
        if (!Number.isFinite(num)) return fallback;
        return num > 2 ? num / 100 : num;
    }

    function disposeGroup(group) {
        if (!group) return;
        group.traverse((node) => {
            if (node.geometry) node.geometry.dispose();
            if (Array.isArray(node.material)) {
                node.material.forEach((mat) => mat?.dispose?.());
            } else if (node.material) {
                node.material.dispose?.();
            }
        });
    }

    function createClubGroup(opts) {
        const group = new THREE.Group();
        group.name = 'clubGroup';

        const handleMaterial = new THREE.MeshStandardMaterial({
            color: opts.productColor || '#ff5733',
            roughness: 0.3,
            metalness: 0.1
        });
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: opts.bodyColor || '#ffffff',
            roughness: 0.3,
            metalness: 0.1
        });
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.2
        });
        const translucentRingMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.2,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7
        });

        // Knob
        const knobPoints = [
            new THREE.Vector2(0, -1.8),
            new THREE.Vector2(0.25, -1.75),
            new THREE.Vector2(0.3, -1.6),
            new THREE.Vector2(0.18, -1.5)
        ];
        const knobMesh = new THREE.Mesh(new THREE.LatheGeometry(knobPoints, 32), blackMaterial);
        knobMesh.name = 'knobPart';
        group.add(knobMesh);

        // Handle
        const handleMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.21, 0.18, 1.2, 32),
            handleMaterial
        );
        handleMesh.position.y = -0.9;
        handleMesh.name = 'handlePart';
        group.add(handleMesh);

        // Ring
        const ringMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.23, 0.21, 0.08, 32),
            translucentRingMaterial
        );
        ringMesh.position.y = -0.25;
        ringMesh.name = 'ringPart';
        group.add(ringMesh);

        // Body
        const bodyPath = new THREE.CubicBezierCurve(
            new THREE.Vector2(0.23, -0.2),
            new THREE.Vector2(0.65, 0.5),
            new THREE.Vector2(0.55, 1.2),
            new THREE.Vector2(0.3, 1.6)
        );
        const bodyMesh = new THREE.Mesh(
            new THREE.LatheGeometry(bodyPath.getPoints(20), 32),
            bodyMaterial
        );
        bodyMesh.name = 'bodyPart';
        group.add(bodyMesh);

        // Top Cap
        const topPoints = [
            new THREE.Vector2(0.3, 1.6),
            new THREE.Vector2(0.32, 1.65),
            new THREE.Vector2(0.28, 1.72),
            new THREE.Vector2(0, 1.75)
        ];
        const topMesh = new THREE.Mesh(new THREE.LatheGeometry(topPoints, 32), blackMaterial);
        topMesh.name = 'topCapPart';
        group.add(topMesh);

        group.rotation.z = Math.PI / 6;
        group.userData.handleMaterial = handleMaterial;
        group.userData.bodyMaterial = bodyMaterial;
        return group;
    }

    function createBallGroup(opts) {
        const geometry = new THREE.SphereGeometry(1.1, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: opts.ballColor || opts.productColor || '#ff5733',
            roughness: 0.3,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'ballPart';
        mesh.userData.ballMaterial = material;
        return mesh;
    }

    function buildGroupByType(type, opts) {
        if (type === 'ball') return createBallGroup(opts);
        return createClubGroup(opts);
    }

    function tuneHexColor(hex, brightness, saturation) {
        const color = new THREE.Color(hex || '#ffffff');
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);

        const nextS = Math.max(0, Math.min(1, hsl.s * saturation));
        // Clamp lightness softly so high brightness values do not wash out to flat white
        const rawL = hsl.l * brightness;
        const nextL = Math.max(0, Math.min(0.92, rawL));

        color.setHSL(hsl.h, nextS, nextL);
        return color;
    }

    function applyVisualAdjustments(opts) {
        if (!activeGroup) return;
        const bright = normalizeFactor(opts.brightness, 1.0);
        const sat = normalizeFactor(opts.saturation, 1.0);

        const { handleMaterial, bodyMaterial, ballMaterial } = activeGroup.userData;
        if (handleMaterial) {
            handleMaterial.color.copy(tuneHexColor(opts.productColor, bright, sat));
        }
        if (bodyMaterial) {
            bodyMaterial.color.copy(tuneHexColor(opts.bodyColor, bright, sat));
        }
        if (ballMaterial) {
            ballMaterial.color.copy(
                tuneHexColor(opts.ballColor || opts.productColor, bright, sat)
            );
        }
    }

    function applyMomentOptions(rawOptions) {
        if (!scene) return;
        const nextOptions = {
            ...DEFAULT_OPTIONS,
            ...(rawOptions && typeof rawOptions === 'object' ? rawOptions : {})
        };
        const nextType = nextOptions.productType || 'club';
        currentOptions = { ...nextOptions, productType: nextType };

        if (!activeGroup || nextType !== currentProductType) {
            if (activeGroup) {
                scene.remove(activeGroup);
                disposeGroup(activeGroup);
            }
            activeGroup = buildGroupByType(nextType, currentOptions);
            currentProductType = nextType;
            scene.add(activeGroup);
        }

        applyVisualAdjustments(currentOptions);
    }

    function handleResize() {
        if (!viewport || !renderer || !camera) return;
        const width = Math.max(1, viewport.clientWidth);
        const height = Math.max(1, viewport.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function destroy() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        window.removeEventListener('resize', handleResize);
        if (activeGroup) {
            if (scene) scene.remove(activeGroup);
            disposeGroup(activeGroup);
            activeGroup = null;
        }
        if (renderer) {
            renderer.dispose();
            renderer.domElement?.remove();
            renderer = null;
        }
        scene = null;
        camera = null;
    }

    function initStage() {
        if (!viewport || typeof THREE === 'undefined') return;

        scene = new THREE.Scene();
        const width = Math.max(1, viewport.clientWidth);
        const height = Math.max(1, viewport.clientHeight);

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0.1, 5.6);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.inset = '0';
        renderer.domElement.style.zIndex = '1';
        viewport.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
        keyLight.position.set(3, 5, 4);
        scene.add(ambientLight, keyLight);

        applyMomentOptions(DEFAULT_OPTIONS);
        window.addEventListener('resize', handleResize);

        function renderLoop() {
            rafId = requestAnimationFrame(renderLoop);
            if (activeGroup) {
                activeGroup.rotation.y += 0.012;
            }
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        renderLoop();
    }

    window.applyMomentOptions = applyMomentOptions;

    if (!window.Moment3DBridge) {
        window.Moment3DBridge = {
            openMomentIn3D(moment, target3DUrl = 'view.html', returnUrl = 'synchro.html') {
                if (!moment || !moment.id) return;
                const mergedOptions = {
                    ...DEFAULT_OPTIONS,
                    ...(moment.options && typeof moment.options === 'object' ? moment.options : {})
                };

                sessionStorage.setItem(
                    PENDING_TARGET_KEY,
                    JSON.stringify({
                        momentId: moment.id,
                        title: moment.title || '',
                        returnUrl
                    })
                );
                sessionStorage.setItem(TEMP_SELECTION_KEY, JSON.stringify(mergedOptions));
                window.location.href = target3DUrl;
            }
        };
    }

    window.SyncSimStage = {
        applyMomentOptions,
        destroy
    };

    window.addEventListener('beforeunload', destroy);
    initStage();
})();