let scene, camera, renderer;
let buildings = [], floatingObjects = [];
let isCameraRotating = true;
let isDaytime = true;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createStarryBackground();
    createCity();
    createFloatingObjects();
    createLights();
    addUI();

    camera.position.set(100, 100, 100);
    camera.lookAt(scene.position);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
}

function createStarryBackground() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1,
        sizeAttenuation: true
    });

    const starsVertices = [];
    for (let i = 0; i < 15000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0015);
}

function createCity() {
    const buildingGeometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
        new THREE.ConeGeometry(0.5, 1, 6)
    ];

    for (let i = 0; i < 200; i++) {
        const geometry = buildingGeometries[Math.floor(Math.random() * buildingGeometries.length)];
        const material = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            shininess: 50 + Math.random() * 50
        });
        const building = new THREE.Mesh(geometry, material);

        const posX = Math.random() * 400 - 200;
        const posZ = Math.random() * 400 - 200;
        const height = Math.random() * 50 + 10;

        building.position.set(posX, height / 2, posZ);
        building.scale.set(
            Math.random() * 10 + 5,
            height,
            Math.random() * 10 + 5
        );

        building.userData = { baseHeight: height, pulseFactor: Math.random() * 0.2 + 0.9 };

        scene.add(building);
        buildings.push(building);
    }
}

function createFloatingObjects() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < 50; i++) {
        const floatingObject = new THREE.Mesh(geometry, material);
        floatingObject.position.set(
            Math.random() * 400 - 200,
            Math.random() * 100 + 50,
            Math.random() * 400 - 200
        );
        scene.add(floatingObject);
        floatingObjects.push(floatingObject);
    }
}

function createLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    const colors = [0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff];
    colors.forEach(color => {
        const light = new THREE.PointLight(color, 1, 50);
        light.position.set(
            Math.random() * 400 - 200,
            Math.random() * 100 + 10,
            Math.random() * 400 - 200
        );
        scene.add(light);
    });
}

function addUI() {
    const uiContainer = document.getElementById('ui');

    const toggleRotationButton = document.createElement('button');
    toggleRotationButton.textContent = 'Toggle Camera Rotation';
    toggleRotationButton.onclick = toggleCameraRotation;
    uiContainer.appendChild(toggleRotationButton);

    const toggleDayNightButton = document.createElement('button');
    toggleDayNightButton.textContent = 'Toggle Day/Night';
    toggleDayNightButton.onclick = toggleDayNight;
    uiContainer.appendChild(toggleDayNightButton);
}

function toggleCameraRotation() {
    isCameraRotating = !isCameraRotating;
}

function toggleDayNight() {
    isDaytime = !isDaytime;
    if (isDaytime) {
        scene.background = new THREE.Color(0x87CEEB);  // Sky blue
        scene.fog.color = new THREE.Color(0x87CEEB);
    } else {
        scene.background = new THREE.Color(0x000011);  // Night blue
        scene.fog.color = new THREE.Color(0x000011);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(buildings);

    buildings.forEach(building => {
        building.material.emissive.setHex(0x000000);
    });

    if (intersects.length > 0) {
        intersects[0].object.material.emissive.setHex(0xff0000);
    }
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0005;
    if (isCameraRotating) {
        camera.position.x = Math.cos(time) * 150;
        camera.position.z = Math.sin(time) * 150;
        camera.lookAt(scene.position);
    }

    buildings.forEach(building => {
        building.rotation.y += 0.002;
        building.material.color.setHSL((time * 0.1 + Math.random() * 0.1) % 1, 0.5, 0.5);
        building.scale.y = building.userData.baseHeight * (1 + Math.sin(time * 2) * building.userData.pulseFactor);
    });

    floatingObjects.forEach(obj => {
        obj.position.y += Math.sin(Date.now() * 0.001 + obj.position.x) * 0.02;
    });

    renderer.render(scene, camera);
}

init();
animate();