const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'Asset', 'Asset3D');
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.glb'));

const jsContent = `/**
 * assetViewer.js - Isolated Asset Gallery
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ASSET_LIST = ${JSON.stringify(files, null, 4)};

class AssetViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.tooltip = document.getElementById('tooltip');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.getElementById('loading-text');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a202c);
        this.scene.fog = new THREE.Fog(0x1a202c, 20, 150);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 30);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 150;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.interactables = [];
        this.allLoadedData = [];
        
        this.initEnvironment();
        this.loadModels();
        this.setupEvents();
        
        this.animate = this.animate.bind(this);
        this.animate();
    }

    initEnvironment() {
        // Grid
        const grid = new THREE.GridHelper(300, 150, 0x00ffff, 0x4a5568);
        grid.position.y = -0.01;
        this.scene.add(grid);

        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.bias = -0.001;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    async loadModels() {
        const loader = new GLTFLoader();
        let loadedCount = 0;
        
        const loadPromises = ASSET_LIST.map((filename, index) => {
            return new Promise((resolve) => {
                loader.load('/Asset/Asset3D/' + filename, (gltf) => {
                    const model = gltf.scene;
                    
                    // Allow shadows
                    model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    // Add metadata for raycasting
                    model.userData = { name: filename };
                    
                    // Add an invisible box helper around it to make raycasting easier and reliable vs small meshes
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    
                    const hitboxGeo = new THREE.BoxGeometry(size.x || 1, size.y || 1, size.z || 1);
                    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
                    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
                    
                    // Keep center relative offset
                    let yOffset = (size.y || 1) / 2;
                    hitbox.userData = { name: filename };
                    
                    let category = 'Props';
                    if (filename.startsWith('weapon') || filename.startsWith('turret') || filename.startsWith('rocket')) category = 'Weapons';
                    else if (filename.startsWith('corridor') || filename.startsWith('hangar') || filename.startsWith('platform') || filename.startsWith('structure') || filename.startsWith('supports') || filename.startsWith('gate') || filename.startsWith('chimney') || filename.startsWith('stairs') || filename.startsWith('pipe')) category = 'Base';
                    else if (filename.startsWith('crater') || filename.startsWith('meteor') || filename.startsWith('rock') || filename.startsWith('terrain')) category = 'Terrain';
                    else if (filename.startsWith('craft') || filename.startsWith('rover') || filename.startsWith('monorail')) category = 'Vehicles';
                    else if (filename.startsWith('alien') || filename.startsWith('astronaut')) category = 'Characters';

                    this.allLoadedData.push({
                        name: filename,
                        category: category,
                        model: model,
                        hitbox: hitbox,
                        hitboxYOffset: yOffset
                    });
                    
                    this.scene.add(model);
                    this.scene.add(hitbox);

                    loadedCount++;
                    this.loadingText.innerText = \`Đã tải \${loadedCount} / \${ASSET_LIST.length} Models...\`;
                    
                    resolve();
                }, undefined, (error) => {
                    console.error('Error loading ' + filename, error);
                    resolve(); // Still resolve so Promise.all completes
                });
            });
        });

        await Promise.all(loadPromises);
        
        // Initial arrangement
        this.rearrangeGrid('All');
        
        // Hide loading
        this.loadingOverlay.style.opacity = '0';
        setTimeout(() => this.loadingOverlay.style.display = 'none', 500);
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Move tooltip visually
            this.tooltip.style.left = event.clientX + 'px';
            this.tooltip.style.top = event.clientY + 'px';
        });

        // Setup category buttons
        const cats = {
            'btn-cat-all': 'All',
            'btn-cat-weapons': 'Weapons',
            'btn-cat-base': 'Base',
            'btn-cat-vehicles': 'Vehicles',
            'btn-cat-terrain': 'Terrain',
            'btn-cat-props': 'Props',
            'btn-cat-characters': 'Characters'
        };

        for (const [id, cat] of Object.entries(cats)) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.category-btn').forEach(b => {
                        b.classList.remove('bg-cyan-700');
                        b.classList.add('bg-zinc-700');
                    });
                    btn.classList.remove('bg-zinc-700');
                    btn.classList.add('bg-cyan-700');

                    this.rearrangeGrid(cat);
                });
            }
        }
    }

    rearrangeGrid(category) {
        const cols = 15;
        const spacingX = 8;
        const spacingZ = 8;

        let visibleModels = this.allLoadedData.filter(data => 
            category === 'All' || data.category === category
        );
        
        this.allLoadedData.forEach(data => {
            if (category === 'All' || data.category === category) {
                data.model.visible = true;
                data.hitbox.visible = true;
                if (!this.interactables.includes(data.hitbox)) {
                    this.interactables.push(data.hitbox);
                }
            } else {
                data.model.visible = false;
                data.hitbox.visible = false;
                const idx = this.interactables.indexOf(data.hitbox);
                if (idx > -1) this.interactables.splice(idx, 1);
            }
        });

        visibleModels.forEach((data, index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            const x = (c - cols/2) * spacingX;
            const z = (r - Math.floor(visibleModels.length / cols)/2) * spacingZ;
            
            data.model.position.set(x, 0, z);
            data.hitbox.position.set(x, data.hitboxYOffset, z);
        });
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            this.tooltip.innerText = hit.userData.name;
            this.tooltip.style.display = 'block';
            document.body.style.cursor = 'pointer';
        } else {
            this.tooltip.style.display = 'none';
            document.body.style.cursor = 'default';
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
window.addEventListener('load', () => {
    new AssetViewer();
});
`;

fs.writeFileSync(path.join(__dirname, 'src', 'assetViewer.js'), jsContent);
console.log('assetViewer.js created successfully with ' + files.length + ' assets.');
