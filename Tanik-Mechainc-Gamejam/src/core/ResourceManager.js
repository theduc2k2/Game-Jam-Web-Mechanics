/**
 * ResourceManager.js — Material & Geometry caching
 * Ensures shared materials/geometries are reused across factories
 */

import * as THREE from 'three';

class ResourceManagerClass {
    constructor() {
        /** @type {Map<string, THREE.Material>} */
        this._materials = new Map();
        /** @type {Map<string, THREE.BufferGeometry>} */
        this._geometries = new Map();
    }

    /**
     * Initialize all shared materials and geometries
     */
    init() {
        // --- Shared Materials ---

        // Player
        this.addMaterial('playerBody', new THREE.MeshStandardMaterial({ color: 0xc97a4e, roughness: 0.8, metalness: 0.2 }));
        this.addMaterial('mechMetal', new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, metalness: 0.5 }));
        this.addMaterial('engine', new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xff3300, emissiveIntensity: 2.0 }));
        this.addMaterial('hologram', new THREE.MeshBasicMaterial({
            color: 0x00ffcc, transparent: true, opacity: 0.15,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
        }));

        // Turret
        this.addMaterial('turretMetal', new THREE.MeshStandardMaterial({ color: 0x9ca3a8, roughness: 0.5, metalness: 0.6 }));
        this.addMaterial('turretDarkMetal', new THREE.MeshStandardMaterial({ color: 0x646e73, roughness: 0.7, metalness: 0.5 }));
        this.addMaterial('missilePod', new THREE.MeshStandardMaterial({ color: 0xba3c3c, roughness: 0.4, metalness: 0.2 }));

        // Enemy
        this.addMaterial('enemyBody', new THREE.MeshStandardMaterial({ color: 0x823232, roughness: 0.8, metalness: 0.3 }));
        this.addMaterial('enemyDetail', new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 }));
        this.addMaterial('enemyEye', new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff0000, emissiveIntensity: 1.0 }));

        // Environment
        this.addMaterial('treeTrunk', new THREE.MeshStandardMaterial({ color: 0x6b4c3a, roughness: 0.9 }));
        this.addMaterial('treeLeaves', new THREE.MeshStandardMaterial({ color: 0x3d6e4b, roughness: 0.8 }));
        this.addMaterial('rock', new THREE.MeshStandardMaterial({ color: 0x7a8276, roughness: 0.9 }));
        this.addMaterial('ground', new THREE.MeshStandardMaterial({ color: 0x7cb35c, roughness: 1.0, metalness: 0.0 }));
        this.addMaterial('militaryGreen', new THREE.MeshStandardMaterial({ color: 0x4b5320, roughness: 0.8 }));
        this.addMaterial('fenceMat', new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.5 }));
        this.addMaterial('concrete', new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }));

        // Effects
        this.addMaterial('scrapDrop', new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xffcc00, emissiveIntensity: 1.0 }));
        this.addMaterial('dustTrail', new THREE.MeshBasicMaterial({ color: 0x93886b, transparent: true, opacity: 0.6 }));

        // Bullet materials
        this.addMaterial('bulletMachineGun', new THREE.MeshBasicMaterial({ color: 0x00ffff }));
        this.addMaterial('bulletMachineGunTrail', new THREE.MeshBasicMaterial({
            color: 0x0088ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
        }));
        this.addMaterial('bulletMissile', new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
        this.addMaterial('bulletMissileTrail', new THREE.MeshBasicMaterial({
            color: 0xff3300, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
        }));
        this.addMaterial('bulletEnemy', new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        this.addMaterial('bulletEnemyTrail', new THREE.MeshBasicMaterial({
            color: 0xff0055, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending
        }));

        // Drone
        this.addMaterial('droneBody', new THREE.MeshStandardMaterial({
            color: 0x4488ff, metalness: 0.6, roughness: 0.3, emissive: 0x00aaff, emissiveIntensity: 0.2
        }));
        this.addMaterial('droneWheel', new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1.0 }));
        this.addMaterial('droneLaser', new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 }));

        // --- Shared Geometries ---

        // Player
        this.addGeometry('mainHull', new THREE.BoxGeometry(4.6, 1.2, 4.6));
        this.addGeometry('tread', new THREE.BoxGeometry(1.2, 1.5, 6.0));
        this.addGeometry('shield', new THREE.BoxGeometry(4.0, 1.0, 0.4));
        this.addGeometry('engineCore', new THREE.BoxGeometry(1.5, 0.5, 0.2));
        this.addGeometry('buildPlane', new THREE.PlaneGeometry(1.2, 1.2));
        this.addGeometry('pad', new THREE.BoxGeometry(1.2, 0.2, 1.2));
        this.addGeometry('armorBlock', new THREE.BoxGeometry(1.2, 1.0, 1.2));
        this.addGeometry('turretBase', new THREE.CylinderGeometry(0.5, 0.6, 0.4, 16));
        this.addGeometry('machineGunBarrel', new THREE.BoxGeometry(0.15, 0.15, 1.0));
        this.addGeometry('missilePodGeo', new THREE.BoxGeometry(0.7, 0.5, 0.8));

        // City Mode Details
        this.addGeometry('buildingBlock', new THREE.BoxGeometry(1.0, 1.0, 1.0));
        this.addGeometry('satelliteDish', new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2));
        this.addGeometry('antenna', new THREE.CylinderGeometry(0.02, 0.05, 1, 4));
        this.addGeometry('windowGeo', new THREE.PlaneGeometry(0.2, 0.2));

        // Base Infrastructure
        this.addGeometry('fenceSegment', new THREE.BoxGeometry(4.0, 1.2, 0.1));
        this.addGeometry('fencePost', new THREE.CylinderGeometry(0.08, 0.08, 1.5, 4));
        this.addGeometry('tentGeo', new THREE.ConeGeometry(1.5, 1.5, 4));
        this.addGeometry('containerGeo', new THREE.BoxGeometry(2.0, 1.2, 1.0));
        this.addGeometry('radarDish', new THREE.SphereGeometry(0.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2));

        // Enemy
        this.addGeometry('enemyBody', new THREE.BoxGeometry(3.5, 1.5, 4.5));
        this.addGeometry('enemyTread', new THREE.BoxGeometry(1.0, 1.2, 5.0));
        this.addGeometry('enemyEye', new THREE.BoxGeometry(1.5, 0.2, 0.1));
        this.addGeometry('enemyTurretBase', new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8));
        this.addGeometry('enemyCannon', new THREE.BoxGeometry(0.4, 0.4, 1.8));

        // Bullets
        this.addGeometry('bulletSmall', new THREE.SphereGeometry(0.15, 8, 8));
        this.addGeometry('bulletMedium', new THREE.SphereGeometry(0.2, 8, 8));
        this.addGeometry('bulletLarge', new THREE.SphereGeometry(0.4, 8, 8));
        this.addGeometry('trailSmall', new THREE.CylinderGeometry(0.15, 0.0, 3.0, 8));
        this.addGeometry('trailMedium', new THREE.CylinderGeometry(0.2, 0.0, 2.0, 8));
        this.addGeometry('trailLarge', new THREE.CylinderGeometry(0.4, 0.0, 1.5, 8));

        // Environment
        this.addGeometry('groundPlane', new THREE.PlaneGeometry(2000, 2000));
        this.addGeometry('trunkGeo', new THREE.CylinderGeometry(0.5, 0.7, 2, 6));
        this.addGeometry('leavesGeo', new THREE.ConeGeometry(2.5, 5, 6));

        // Particles & Effects
        this.addGeometry('particleBox', new THREE.BoxGeometry(0.5, 0.5, 0.5));
        this.addGeometry('dustSphere', new THREE.SphereGeometry(0.5, 4, 4));
        this.addGeometry('scrapBox', new THREE.BoxGeometry(0.8, 0.8, 0.8));

        // Drone
        this.addGeometry('droneBodyGeo', new THREE.BoxGeometry(0.8, 0.5, 1.0));
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        wheelGeo.rotateZ(Math.PI / 2);
        this.addGeometry('droneWheel', wheelGeo);

        // Pillar (translate so it scales from bottom)
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 8);
        pillarGeo.translate(0, -0.5, 0);
        this.addGeometry('pillar', pillarGeo);
    }

    /**
     * Add a material to cache
     * @param {string} name
     * @param {THREE.Material} material
     */
    addMaterial(name, material) {
        this._materials.set(name, material);
    }

    /**
     * Get a cached material
     * @param {string} name
     * @returns {THREE.Material}
     */
    getMaterial(name) {
        const mat = this._materials.get(name);
        if (!mat) console.warn(`[ResourceManager] Material "${name}" not found`);
        return mat;
    }

    /**
     * Get a clone of a material (for per-instance modifications)
     * @param {string} name
     * @returns {THREE.Material}
     */
    cloneMaterial(name) {
        const mat = this._materials.get(name);
        if (!mat) {
            console.warn(`[ResourceManager] Material "${name}" not found for clone`);
            return null;
        }
        return mat.clone();
    }

    /**
     * Add a geometry to cache
     * @param {string} name
     * @param {THREE.BufferGeometry} geometry
     */
    addGeometry(name, geometry) {
        this._geometries.set(name, geometry);
    }

    /**
     * Get a cached geometry
     * @param {string} name
     * @returns {THREE.BufferGeometry}
     */
    getGeometry(name) {
        const geo = this._geometries.get(name);
        if (!geo) console.warn(`[ResourceManager] Geometry "${name}" not found`);
        return geo;
    }

    /**
     * Dispose all cached resources
     */
    dispose() {
        for (const mat of this._materials.values()) {
            mat.dispose();
        }
        for (const geo of this._geometries.values()) {
            geo.dispose();
        }
        this._materials.clear();
        this._geometries.clear();
    }
}

// Singleton
export const ResourceManager = new ResourceManagerClass();
