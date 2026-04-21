/**
 * GameState.js — Centralized game state management
 * Single source of truth for all mutable game data
 */

import { PLAYER, BUILD_GRID } from '../core/Config.js';
import { EventBus, Events } from '../core/EventBus.js';

class GameStateClass {
    constructor() {
        this.reset();
    }

    /**
     * Reset all state to initial values
     */
    reset() {
        // Player state
        this.playerHealth = PLAYER.BASE_MAX_HEALTH;
        this.maxHealth = PLAYER.BASE_MAX_HEALTH;
        this.baseMaxHealth = PLAYER.BASE_MAX_HEALTH;
        this.scrap = PLAYER.INITIAL_SCRAP;
        this.score = 0;
        this.kills = 0;

        // Game mode flags
        this.gameOver = false;
        this.isBuildMode = false;
        this.isStationary = false;

        // Transformer deploy animation progress [0..1]
        this.deployProgress = 0;

        // Build grid data (deep copy from config)
        this.buildGridData = BUILD_GRID.INITIAL_DATA.map(row => [...row]);

        // Selected shop item for build mode
        this.selectedShopItem = 'machine_gun';

        // Entity arrays
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.dustTrailParticles = [];
        this.lasers = [];
        this.harvestables = [];
        this.droppedScraps = [];
        this.activeDrones = [];
        this.activeTurrets = [];
    }

    /**
     * Add scrap and emit event
     * @param {number} amount
     */
    addScrap(amount) {
        this.scrap += amount;
        EventBus.emit(Events.SCRAP_CHANGED, { scrap: this.scrap });
    }

    /**
     * Spend scrap if affordable
     * @param {number} amount
     * @returns {boolean} true if spent successfully
     */
    spendScrap(amount) {
        if (this.scrap >= amount) {
            this.scrap -= amount;
            EventBus.emit(Events.SCRAP_CHANGED, { scrap: this.scrap });
            return true;
        }
        return false;
    }

    /**
     * Apply damage to player
     * @param {number} amount
     * @returns {boolean} true if player died
     */
    damagePlayer(amount) {
        this.playerHealth -= amount;
        EventBus.emit(Events.PLAYER_DAMAGE, { hp: this.playerHealth, maxHp: this.maxHealth });

        if (this.playerHealth <= 0) {
            this.gameOver = true;
            EventBus.emit(Events.GAME_OVER);
            return true;
        }
        return false;
    }

    /**
     * Recalculate max health based on armor count and mode
     */
    recalculateHealth() {
        let armorCount = 0;
        for (let y = 0; y < BUILD_GRID.SIZE; y++) {
            for (let x = 0; x < BUILD_GRID.SIZE; x++) {
                if (this.buildGridData[y][x] === 'armor') armorCount++;
            }
        }
        this.baseMaxHealth = PLAYER.BASE_MAX_HEALTH + (armorCount * PLAYER.ARMOR_HEALTH_BONUS);
        this.maxHealth = this.baseMaxHealth + (this.isStationary ? PLAYER.SIEGE_BONUS_HEALTH : 0);
        this.playerHealth = Math.min(this.playerHealth, this.maxHealth);
    }

    /**
     * Toggle build mode
     * @returns {boolean} new build mode state
     */
    toggleBuildMode() {
        if (this.gameOver) return this.isBuildMode;
        this.isBuildMode = !this.isBuildMode;

        if (this.isBuildMode) {
            EventBus.emit(Events.BUILD_ENTER);
        } else {
            EventBus.emit(Events.BUILD_EXIT);
        }
        return this.isBuildMode;
    }

    /**
     * Toggle siege/mobile mode
     * @returns {boolean} new stationary state
     */
    toggleMode() {
        if (this.isBuildMode || this.gameOver) return this.isStationary;

        this.isStationary = !this.isStationary;

        if (this.isStationary) {
            this.maxHealth += PLAYER.SIEGE_BONUS_HEALTH;
            this.playerHealth += PLAYER.SIEGE_BONUS_HEALTH;
        } else {
            this.maxHealth -= PLAYER.SIEGE_BONUS_HEALTH;
            this.playerHealth = Math.min(this.playerHealth, this.maxHealth);
        }

        EventBus.emit(Events.PLAYER_MODE_CHANGE, { isStationary: this.isStationary });
        return this.isStationary;
    }
}

// Singleton
export const GameState = new GameStateClass();
