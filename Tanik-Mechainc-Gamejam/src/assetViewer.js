/**
 * assetViewer.js - Isolated Asset Gallery
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ASSET_LIST = [
    "alien.glb",
    "astronautA.glb",
    "astronautB.glb",
    "barrel.glb",
    "barrels.glb",
    "barrels_rail.glb",
    "bones.glb",
    "chimney.glb",
    "chimney_detailed.glb",
    "corridor.glb",
    "corridor_corner.glb",
    "corridor_cornerRound.glb",
    "corridor_cornerRoundWindow.glb",
    "corridor_cross.glb",
    "corridor_detailed.glb",
    "corridor_end.glb",
    "corridor_open.glb",
    "corridor_roof.glb",
    "corridor_split.glb",
    "corridor_wall.glb",
    "corridor_wallCorner.glb",
    "corridor_window.glb",
    "corridor_windowClosed.glb",
    "craft_cargoA.glb",
    "craft_cargoB.glb",
    "craft_miner.glb",
    "craft_racer.glb",
    "craft_speederA.glb",
    "craft_speederB.glb",
    "craft_speederC.glb",
    "craft_speederD.glb",
    "crater.glb",
    "craterLarge.glb",
    "desk_chair.glb",
    "desk_chairArms.glb",
    "desk_chairStool.glb",
    "desk_computer.glb",
    "desk_computerCorner.glb",
    "desk_computerScreen.glb",
    "gate_complex.glb",
    "gate_simple.glb",
    "hangar_largeA.glb",
    "hangar_largeB.glb",
    "hangar_roundA.glb",
    "hangar_roundB.glb",
    "hangar_roundGlass.glb",
    "hangar_smallA.glb",
    "hangar_smallB.glb",
    "machine_barrel.glb",
    "machine_barrelLarge.glb",
    "machine_generator.glb",
    "machine_generatorLarge.glb",
    "machine_wireless.glb",
    "machine_wirelessCable.glb",
    "meteor.glb",
    "meteor_detailed.glb",
    "meteor_half.glb",
    "monorail_trackCornerLarge.glb",
    "monorail_trackCornerSmall.glb",
    "monorail_trackSlope.glb",
    "monorail_trackStraight.glb",
    "monorail_trackSupport.glb",
    "monorail_trackSupportCorner.glb",
    "monorail_trainBox.glb",
    "monorail_trainCargo.glb",
    "monorail_trainEnd.glb",
    "monorail_trainFlat.glb",
    "monorail_trainFront.glb",
    "monorail_trainPassenger.glb",
    "pipe_corner.glb",
    "pipe_cornerDiagonal.glb",
    "pipe_cornerRound.glb",
    "pipe_cornerRoundLarge.glb",
    "pipe_cross.glb",
    "pipe_end.glb",
    "pipe_entrance.glb",
    "pipe_open.glb",
    "pipe_rampLarge.glb",
    "pipe_rampSmall.glb",
    "pipe_ring.glb",
    "pipe_ringHigh.glb",
    "pipe_ringHighEnd.glb",
    "pipe_ringSupport.glb",
    "pipe_split.glb",
    "pipe_straight.glb",
    "pipe_supportHigh.glb",
    "pipe_supportLow.glb",
    "platform_center.glb",
    "platform_corner.glb",
    "platform_cornerOpen.glb",
    "platform_cornerRound.glb",
    "platform_end.glb",
    "platform_high.glb",
    "platform_large.glb",
    "platform_long.glb",
    "platform_low.glb",
    "platform_side.glb",
    "platform_small.glb",
    "platform_smallDiagonal.glb",
    "platform_straight.glb",
    "rail.glb",
    "rail_corner.glb",
    "rail_end.glb",
    "rail_middle.glb",
    "rock.glb",
    "rocket_baseA.glb",
    "rocket_baseB.glb",
    "rocket_finsA.glb",
    "rocket_finsB.glb",
    "rocket_fuelA.glb",
    "rocket_fuelB.glb",
    "rocket_sidesA.glb",
    "rocket_sidesB.glb",
    "rocket_topA.glb",
    "rocket_topB.glb",
    "rocks_smallA.glb",
    "rocks_smallB.glb",
    "rock_crystals.glb",
    "rock_crystalsLargeA.glb",
    "rock_crystalsLargeB.glb",
    "rock_largeA.glb",
    "rock_largeB.glb",
    "rover.glb",
    "satelliteDish.glb",
    "satelliteDish_detailed.glb",
    "satelliteDish_large.glb",
    "stairs.glb",
    "stairs_corner.glb",
    "stairs_short.glb",
    "structure.glb",
    "structure_closed.glb",
    "structure_detailed.glb",
    "structure_diagonal.glb",
    "supports_high.glb",
    "supports_low.glb",
    "terrain.glb",
    "terrain_ramp.glb",
    "terrain_rampLarge.glb",
    "terrain_rampLarge_detailed.glb",
    "terrain_roadCorner.glb",
    "terrain_roadCross.glb",
    "terrain_roadEnd.glb",
    "terrain_roadSplit.glb",
    "terrain_roadStraight.glb",
    "terrain_side.glb",
    "terrain_sideCliff.glb",
    "terrain_sideCorner.glb",
    "terrain_sideCornerInner.glb",
    "terrain_sideEnd.glb",
    "turret_double.glb",
    "turret_single.glb",
    "weapon_gun.glb",
    "weapon_rifle.glb"
];

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
                    this.loadingText.innerText = `Đã tải ${loadedCount} / ${ASSET_LIST.length} Models...`;
                    
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
