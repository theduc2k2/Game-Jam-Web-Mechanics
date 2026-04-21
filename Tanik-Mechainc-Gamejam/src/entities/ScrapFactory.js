/**
 * ScrapFactory.js — Dropped scrap items
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { randomInt } from '../utils/MathUtils.js';
import { SCORING } from '../core/Config.js';

export class ScrapFactory {
    /**
     * Create dropped scrap items at a position
     * @param {THREE.Vector3} position
     * @param {number} count
     * @returns {THREE.Mesh[]} array of scrap meshes
     */
    static createMultiple(position, count) {
        const RM = ResourceManager;
        const scraps = [];

        for (let i = 0; i < count; i++) {
            const scrapItem = new THREE.Mesh(RM.getGeometry('scrapBox'), RM.cloneMaterial('scrapDrop'));
            scrapItem.position.copy(position);
            scrapItem.position.x += (Math.random() - 0.5) * 8;
            scrapItem.position.z += (Math.random() - 0.5) * 8;
            scrapItem.position.y = 0.5;

            scrapItem.value = randomInt(SCORING.SCRAP_VALUE_MIN, SCORING.SCRAP_VALUE_MAX);
            scrapItem.targeted = false;
            scrapItem.isDropped = true;

            scrapItem.rotation.set(Math.random(), Math.random(), Math.random());
            scrapItem.castShadow = true;

            scraps.push(scrapItem);
        }

        return scraps;
    }
}
