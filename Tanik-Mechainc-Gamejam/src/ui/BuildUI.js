/**
 * BuildUI.js — Build mode shop, grid interaction, item placement
 */

import * as THREE from 'three';
import { ITEMS, SCORING } from '../core/Config.js';
import { GameState } from '../state/GameState.js';
import { EventBus, Events } from '../core/EventBus.js';

export class BuildUI {
    constructor() {
        /** @type {THREE.Raycaster} */
        this._raycaster = new THREE.Raycaster();

        /** @type {THREE.Mesh|null} */
        this._hoveredPlane = null;
    }

    /**
     * Initialize build UI
     */
    init() {
        // Expose selectShopItem globally for inline onclick handlers
        window.selectShopItem = (itemId) => {
            GameState.selectedShopItem = itemId;
            document.querySelectorAll('.shop-item').forEach(el => el.classList.remove('selected'));
            const el = document.getElementById(`shop-${itemId}`);
            if (el) el.classList.add('selected');
        };

        // Select default
        window.selectShopItem('machine_gun');
    }

    /**
     * Handle pointer move for build grid hover
     * @param {THREE.PerspectiveCamera} camera
     * @param {{x: number, y: number}} mouse
     * @param {THREE.Mesh[]} buildPlanes
     */
    handlePointerMove(camera, mouse, buildPlanes) {
        if (!GameState.isBuildMode) return;

        this._raycaster.setFromCamera(mouse, camera);
        const intersects = this._raycaster.intersectObjects(buildPlanes);

        // Reset previous hover
        if (this._hoveredPlane) {
            this._hoveredPlane.material.color.setHex(0x00ffcc);
            this._hoveredPlane.material.opacity = 0.15;
        }

        if (intersects.length > 0) {
            this._hoveredPlane = intersects[0].object;
            this._hoveredPlane.material.color.setHex(0xffffff);
            this._hoveredPlane.material.opacity = 0.5;
        } else {
            this._hoveredPlane = null;
        }
    }

    /**
     * Handle pointer click for item placement
     * @param {Map} buildPlanesMap - uuid → grid coords
     * @param {Function} onRebuild - callback to rebuild turrets
     */
    handlePointerDown(buildPlanesMap, onRebuild) {
        if (!GameState.isBuildMode || !GameState.selectedShopItem || !this._hoveredPlane) return;

        const gridCoords = buildPlanesMap.get(this._hoveredPlane.uuid);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (GameState.selectedShopItem === 'remove') {
            if (GameState.buildGridData[y][x]) {
                const refund = Math.floor(ITEMS[GameState.buildGridData[y][x]].cost * SCORING.REFUND_RATIO);
                GameState.addScrap(refund);
                GameState.buildGridData[y][x] = null;
                onRebuild();
                GameState.recalculateHealth();
            }
            return;
        }

        const itemConfig = ITEMS[GameState.selectedShopItem];
        if (GameState.scrap >= itemConfig.cost) {
            // Refund existing item
            if (GameState.buildGridData[y][x]) {
                const refund = Math.floor(ITEMS[GameState.buildGridData[y][x]].cost * SCORING.REFUND_RATIO);
                GameState.addScrap(refund);
            }

            GameState.spendScrap(itemConfig.cost);
            GameState.buildGridData[y][x] = GameState.selectedShopItem;
            onRebuild();
            GameState.recalculateHealth();
        }
    }
}
