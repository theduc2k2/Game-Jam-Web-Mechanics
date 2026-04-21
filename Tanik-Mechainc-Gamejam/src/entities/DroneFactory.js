/**
 * DroneFactory.js — Worker drone creation
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { DRONE } from '../core/Config.js';

export class DroneFactory {
    /**
     * Create a worker drone
     * @param {THREE.Vector3} spawnPosition - usually player position
     * @param {THREE.Object3D} targetEntity - what this drone goes to harvest/pick up
     * @returns {THREE.Group}
     */
    static create(spawnPosition, targetEntity) {
        const RM = ResourceManager;
        const droneGroup = new THREE.Group();
        droneGroup.position.copy(spawnPosition);
        droneGroup.position.y = 0.4;

        // Body (clone material for per-drone emissive control)
        const bodyMat = RM.cloneMaterial('droneBody');
        const body = new THREE.Mesh(RM.getGeometry('droneBodyGeo'), bodyMat);
        body.position.y = 0.3;
        body.castShadow = true;
        droneGroup.add(body);
        droneGroup.bodyMat = bodyMat;

        // Wheels
        const wheelMat = RM.getMaterial('droneWheel');
        const wheelGeo = RM.getGeometry('droneWheel');
        for (const x of [-0.45, 0.45]) {
            for (const z of [-0.3, 0.3]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(x, 0.2, z);
                droneGroup.add(w);
            }
        }

        // Custom properties
        droneGroup.state = 'moving_to';
        droneGroup.target = targetEntity;
        droneGroup.speed = DRONE.SPEED;
        droneGroup.harvestTimer = 0;
        droneGroup.carryingValue = 0;
        droneGroup.laserLine = null;

        return droneGroup;
    }
}
