/**
 * ModelManager.js — Global Object Pooling and Preloader
 * Loads all .glb files upfront to avoid rendering stalls during gameplay.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const ASSET_LIST = [
    "alien.glb", "astronautA.glb", "astronautB.glb", "barrel.glb", "barrels.glb", 
    "barrels_rail.glb", "bones.glb", "chimney.glb", "chimney_detailed.glb", 
    "corridor.glb", "corridor_corner.glb", "corridor_cornerRound.glb", 
    "corridor_cornerRoundWindow.glb", "corridor_cross.glb", "corridor_detailed.glb", 
    "corridor_end.glb", "corridor_open.glb", "corridor_roof.glb", "corridor_split.glb", 
    "corridor_wall.glb", "corridor_wallCorner.glb", "corridor_window.glb", 
    "corridor_windowClosed.glb", "craft_cargoA.glb", "craft_cargoB.glb", 
    "craft_miner.glb", "craft_racer.glb", "craft_speederA.glb", "craft_speederB.glb", 
    "craft_speederC.glb", "craft_speederD.glb", "crater.glb", "craterLarge.glb", 
    "desk_chair.glb", "desk_chairArms.glb", "desk_chairStool.glb", "desk_computer.glb", 
    "desk_computerCorner.glb", "desk_computerScreen.glb", "gate_complex.glb", 
    "gate_simple.glb", "hangar_largeA.glb", "hangar_largeB.glb", "hangar_roundA.glb", 
    "hangar_roundB.glb", "hangar_roundGlass.glb", "hangar_smallA.glb", "hangar_smallB.glb", 
    "machine_barrel.glb", "machine_barrelLarge.glb", "machine_generator.glb", 
    "machine_generatorLarge.glb", "machine_wireless.glb", "machine_wirelessCable.glb", 
    "meteor.glb", "meteor_detailed.glb", "meteor_half.glb", "monorail_trackCornerLarge.glb", 
    "monorail_trackCornerSmall.glb", "monorail_trackSlope.glb", "monorail_trackStraight.glb", 
    "monorail_trackSupport.glb", "monorail_trackSupportCorner.glb", "monorail_trainBox.glb", 
    "monorail_trainCargo.glb", "monorail_trainEnd.glb", "monorail_trainFlat.glb", 
    "monorail_trainFront.glb", "monorail_trainPassenger.glb", "pipe_corner.glb", 
    "pipe_cornerDiagonal.glb", "pipe_cornerRound.glb", "pipe_cornerRoundLarge.glb", 
    "pipe_cross.glb", "pipe_end.glb", "pipe_entrance.glb", "pipe_open.glb", 
    "pipe_rampLarge.glb", "pipe_rampSmall.glb", "pipe_ring.glb", "pipe_ringHigh.glb", 
    "pipe_ringHighEnd.glb", "pipe_ringSupport.glb", "pipe_split.glb", "pipe_straight.glb", 
    "pipe_supportHigh.glb", "pipe_supportLow.glb", "platform_center.glb", 
    "platform_corner.glb", "platform_cornerOpen.glb", "platform_cornerRound.glb", 
    "platform_end.glb", "platform_high.glb", "platform_large.glb", "platform_long.glb", 
    "platform_low.glb", "platform_side.glb", "platform_small.glb", "platform_smallDiagonal.glb", 
    "platform_straight.glb", "rail.glb", "rail_corner.glb", "rail_end.glb", 
    "rail_middle.glb", "rock.glb", "rocket_baseA.glb", "rocket_baseB.glb", 
    "rocket_finsA.glb", "rocket_finsB.glb", "rocket_fuelA.glb", "rocket_fuelB.glb", 
    "rocket_sidesA.glb", "rocket_sidesB.glb", "rocket_topA.glb", "rocket_topB.glb", 
    "rocks_smallA.glb", "rocks_smallB.glb", "rock_crystals.glb", "rock_crystalsLargeA.glb", 
    "rock_crystalsLargeB.glb", "rock_largeA.glb", "rock_largeB.glb", "rover.glb", 
    "satelliteDish.glb", "satelliteDish_detailed.glb", "satelliteDish_large.glb", 
    "stairs.glb", "stairs_corner.glb", "stairs_short.glb", "structure.glb", 
    "structure_closed.glb", "structure_detailed.glb", "structure_diagonal.glb", 
    "supports_high.glb", "supports_low.glb", "terrain.glb", "terrain_ramp.glb", 
    "terrain_rampLarge.glb", "terrain_rampLarge_detailed.glb", "terrain_roadCorner.glb", 
    "terrain_roadCross.glb", "terrain_roadEnd.glb", "terrain_roadSplit.glb", 
    "terrain_roadStraight.glb", "terrain_side.glb", "terrain_sideCliff.glb", 
    "terrain_sideCorner.glb", "terrain_sideCornerInner.glb", "terrain_sideEnd.glb", 
    "turret_double.glb", "turret_single.glb", "weapon_gun.glb", "weapon_rifle.glb"
];

class ModelManagerClass {
    constructor() {
        this.cache = new Map(); // Stores the root Group of each loaded GLB
        this.thumbnails = new Map(); // Stores base64 DataURLs of models

        // Isolated renderer for thumbnails
        this._thumbRenderer = null;
        this._thumbCamera = null;
        this._thumbScene = null;
    }

    /**
     * Internal setup for the thumbnail factory
     */
    _setupThumbFactory() {
        if (this._thumbRenderer) return;

        this._thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this._thumbRenderer.setSize(128, 128);
        this._thumbRenderer.setClearColor(0x000000, 0);

        this._thumbCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this._thumbScene = new THREE.Scene();

        const light = new THREE.DirectionalLight(0xffffff, 2.5);
        light.position.set(2, 2, 5);
        this._thumbScene.add(light);
        this._thumbScene.add(new THREE.AmbientLight(0xffffff, 1.5));
    }

    /**
     * Preload all models sequentially or via chunked promises
     * @param {(progress: number) => void} onProgress Callback representing 0.0 to 1.0 progress
     * @returns {Promise<void>}
     */
    async init(onProgress) {
        const loader = new GLTFLoader();
        let loadedCount = 0;
        const total = ASSET_LIST.length;

        // Load 10 files at a time to prevent blocking the browser thread heavily
        const CHUNK_SIZE = 10;
        for (let i = 0; i < total; i += CHUNK_SIZE) {
            const chunk = ASSET_LIST.slice(i, i + CHUNK_SIZE);
            const chunkPromises = chunk.map((filename) => {
                return new Promise((resolve) => {
                    loader.load('/Asset/Asset3D/' + filename, (gltf) => {
                        const baseName = filename.replace('.glb', '');
                        
                        // Enable shadows
                        gltf.scene.traverse((node) => {
                            if (node.isMesh) {
                                node.castShadow = true;
                                node.receiveShadow = true;
                            }
                        });

                        this.cache.set(baseName, gltf.scene);

                        // Capture thumbnail
                        this._setupThumbFactory();
                        const thumb = this._captureThumbnail(gltf.scene);
                        this.thumbnails.set(baseName, thumb);

                        loadedCount++;
                        if (onProgress) onProgress(loadedCount / total);
                        resolve();
                    }, undefined, (error) => {
                        console.error('Failed to load ' + filename, error);
                        loadedCount++;
                        if (onProgress) onProgress(loadedCount / total);
                        resolve(); // Resolve to prevent total hang
                    });
                });
            });
            await Promise.all(chunkPromises);
        }

        // Clean up thumb factory to save memory
        if (this._thumbRenderer) {
            this._thumbRenderer.dispose();
            this._thumbRenderer = null;
        }
    }

    /**
     * Renders a model to a small DataURL
     */
    _captureThumbnail(item) {
        this._thumbScene.add(item);

        // Frame the object
        const box = new THREE.Box3().setFromObject(item);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this._thumbCamera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= 1.5; // Zoom out a bit
        this._thumbCamera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.5, center.z + cameraZ);
        this._thumbCamera.lookAt(center);

        this._thumbRenderer.render(this._thumbScene, this._thumbCamera);
        const dataUrl = this._thumbRenderer.domElement.toDataURL('image/png');

        this._thumbScene.remove(item);
        return dataUrl;
    }

    /**
     * Get an instantiated clone of a model from the pool.
     * @param {string} name e.g., 'rover', 'turret_single'
     * @returns {THREE.Group|null} A fresh clone of the object
     */
    get(name) {
        // Mapping for legacy names to ensure backward compatibility with hardcoded config
        const mapping = {
            'machine_gun': 'turret_single',
            'missile': 'turret_double',
            'armor': 'structure_closed' // Better fit for armor block
        };

        const targetName = mapping[name] || name;

        if (!this.cache.has(targetName)) {
            return null;
        }
        return this.cache.get(targetName).clone();
    }
}

export const ModelManager = new ModelManagerClass();
