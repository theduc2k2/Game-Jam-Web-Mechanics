/**
 * CameraSystem.js — Camera follow and build mode camera
 */

import * as THREE from 'three';
import { CAMERA, RENDERING } from '../core/Config.js';
import { GameState } from '../state/GameState.js';

export class CameraSystem {
    /**
     * @param {THREE.PerspectiveCamera} camera
     * @param {Object} player - player entity data
     * @param {THREE.DirectionalLight} sunLight
     * @param {THREE.GridHelper} gridHelper
     */
    constructor(camera, player, sunLight, gridHelper) {
        this.camera = camera;
        this.player = player;
        this.sunLight = sunLight;
        this.gridHelper = gridHelper;
    }

    /**
     * Update camera position and sun light tracking
     */
    update(dt) {
        if (GameState.isBuildMode) return;

        const playerPos = this.player.group.position;

        // Smooth camera follow
        const targetCamPos = new THREE.Vector3(
            playerPos.x,
            playerPos.y + CAMERA.OFFSET_Y,
            playerPos.z + CAMERA.OFFSET_Z
        );
        this.camera.position.lerp(targetCamPos, CAMERA.FOLLOW_LERP);
        this.camera.lookAt(playerPos);

        // Sunlight follows player
        this.sunLight.position.x = playerPos.x + 60;
        this.sunLight.position.y = 80;
        this.sunLight.position.z = playerPos.z - 40;
        this.sunLight.target.position.copy(playerPos);
        this.sunLight.target.updateMatrixWorld();

        // Grid follows player
        this.gridHelper.position.x = playerPos.x;
        this.gridHelper.position.z = playerPos.z;

        // Update matrices
        this.player.group.updateMatrixWorld(true);
    }

    /**
     * Enter build mode camera position
     */
    enterBuildMode() {
        const playerPos = this.player.group.position;
        this.camera.position.set(
            playerPos.x,
            playerPos.y + CAMERA.BUILD_OFFSET_Y,
            playerPos.z + CAMERA.BUILD_OFFSET_Z
        );
        this.camera.lookAt(playerPos);
    }
}
