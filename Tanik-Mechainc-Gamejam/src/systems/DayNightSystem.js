/**
 * DayNightSystem.js — Day/night cycle, lighting, fog
 */

import * as THREE from 'three';
import { DAYNIGHT } from '../core/Config.js';
import { GameState } from '../state/GameState.js';

export class DayNightSystem {
    /**
     * @param {THREE.Scene} scene
     * @param {Object} lights - { sunLight, hemiLight, headLight, deckLight }
     */
    constructor(scene, lights) {
        this.scene = scene;
        this.sunLight = lights.sunLight;
        this.hemiLight = lights.hemiLight;
        this.headLight = lights.headLight;
        this.deckLight = lights.deckLight;
        this.gameTime = DAYNIGHT.INITIAL_TIME;

        this.colorDay = new THREE.Color(DAYNIGHT.DAY_COLOR);
        this.colorNight = new THREE.Color(DAYNIGHT.NIGHT_COLOR);
    }

    /**
     * Update lighting based on time
     */
    update(dt) {
        if (GameState.sceneState === 'GARAGE') {
            // Keep background and fog neutral dark
            this.scene.background.setHex(0x0a0a0a);
            this.scene.fog.color.setHex(0x0a0a0a);

            // Static bright lighting
            this.sunLight.color.setHex(0xffffff);
            this.sunLight.intensity = 1.0;
            this.hemiLight.intensity = 0.8;
            
            // Subtle directional/headlight to light up the grid
            this.headLight.intensity = 20;
            this.deckLight.intensity = 5;
            return;
        }

        this.gameTime += DAYNIGHT.SPEED;
        const daylightFactor = Math.sin(this.gameTime);
        const isDay = daylightFactor > 0;
        const lerpFactor = Math.max(0, Math.min(1, daylightFactor * 2));

        // Sky & fog color
        this.scene.background.lerpColors(this.colorNight, this.colorDay, lerpFactor);
        this.scene.fog.color.lerpColors(this.colorNight, this.colorDay, lerpFactor);

        if (isDay) {
            this.sunLight.color.setHex(0xffffff);
            this.sunLight.intensity = Math.max(0.1, daylightFactor * 1.5);
            this.hemiLight.intensity = 0.6 + daylightFactor * 0.4;
            
            const targetHeadLight = 0;
            const targetDeckLight = GameState.isStationary ? 2 : 0; // Much lower point light
            
            this.headLight.intensity = THREE.MathUtils.lerp(this.headLight.intensity, targetHeadLight, 0.05);
            this.deckLight.intensity = THREE.MathUtils.lerp(this.deckLight.intensity, targetDeckLight, 0.05);
        } else {
            this.sunLight.color.setHex(0x4466aa);
            this.sunLight.intensity = Math.max(0.1, -daylightFactor * 0.8);
            this.hemiLight.intensity = 0.35;
            
            const targetHeadLight = GameState.isStationary ? 0 : 60;
            const targetDeckLight = GameState.isStationary ? 4 : 2; // Subtle base lighting

            this.headLight.intensity = THREE.MathUtils.lerp(this.headLight.intensity, targetHeadLight, 0.05);
            this.deckLight.intensity = THREE.MathUtils.lerp(this.deckLight.intensity, targetDeckLight, 0.05);
        }
    }
}
