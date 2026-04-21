/**
 * UIManager.js — UI orchestrator coordinating HUD and BuildUI
 */

import { EventBus, Events } from '../core/EventBus.js';
import { GameState } from '../state/GameState.js';
import { HUD } from './HUD.js';
import { BuildUI } from './BuildUI.js';

export class UIManager {
    constructor() {
        this.hud = new HUD();
        this.buildUI = new BuildUI();
    }

    /**
     * Initialize all UI components and event listeners
     */
    init() {
        this.hud.init();
        this.buildUI.init();

        // Listen to events for UI updates
        EventBus.on(Events.GAME_OVER, () => {
            document.getElementById('game-over').style.display = 'block';
        });

        EventBus.on(Events.GAME_RESET, () => {
            document.getElementById('game-over').style.display = 'none';
        });

        EventBus.on(Events.PLAYER_MODE_CHANGE, (data) => {
            const status = document.getElementById('mode-status');
            if (data.isStationary) {
                status.innerText = "MODE: SIEGE (CẮM TRẠI & KHAI THÁC)";
                status.classList.add('mode-siege');
            } else {
                status.innerText = "MODE: MOBILE (DI CHUYỂN)";
                status.classList.remove('mode-siege');
            }
        });

        EventBus.on(Events.BUILD_ENTER, () => {
            document.getElementById('build-ui').style.display = 'flex';
            document.getElementById('build-overlay-text').style.display = 'block';
            document.getElementById('ui-scrap-val').innerText = GameState.scrap;
        });

        EventBus.on(Events.BUILD_EXIT, () => {
            document.getElementById('build-ui').style.display = 'none';
            document.getElementById('build-overlay-text').style.display = 'none';
        });

        EventBus.on(Events.SCRAP_CHANGED, (data) => {
            document.getElementById('ui-scrap-val').innerText = data.scrap;
        });
    }

    /**
     * Update HUD display (called each frame)
     */
    update() {
        this.hud.update();
    }
}
