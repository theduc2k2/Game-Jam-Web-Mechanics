/**
 * HUD.js — Health bar, score, kills, scrap display
 */

import { GameState } from '../state/GameState.js';

export class HUD {
    constructor() {
        this._healthFill = null;
        this._hpVal = null;
        this._maxHpVal = null;
        this._scoreEl = null;
        this._killsEl = null;
        this._scrapEl = null;
        this._dronesVal = null;
    }

    /**
     * Cache DOM element references
     */
    init() {
        this._healthFill = document.getElementById('health-fill');
        this._hpVal = document.getElementById('hp-val');
        this._maxHpVal = document.getElementById('max-hp-val');
        this._scoreEl = document.getElementById('score');
        this._killsEl = document.getElementById('kills');
        this._scrapEl = document.getElementById('scrap-val');
        this._dronesVal = document.getElementById('drones-val');
    }

    /**
     * Update all HUD elements from GameState
     */
    update() {
        const hp = Math.max(0, GameState.playerHealth);
        const maxHp = GameState.maxHealth;

        this._healthFill.style.width = `${(hp / maxHp) * 100}%`;
        this._hpVal.innerText = Math.floor(hp);
        this._maxHpVal.innerText = maxHp;
        this._scoreEl.innerText = Math.floor(GameState.score);
        this._killsEl.innerText = GameState.kills;
        this._scrapEl.innerText = GameState.scrap;
        this._dronesVal.innerText = GameState.activeDrones.length;
    }
}
