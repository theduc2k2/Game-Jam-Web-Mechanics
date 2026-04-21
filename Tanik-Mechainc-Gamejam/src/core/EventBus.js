/**
 * EventBus.js — Observer Pattern global pub/sub
 * Decouples systems from direct dependencies
 */

class EventBusClass {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();

        /** @type {Map<string, Function>} */
        this._onceListeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe once to an event
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this._listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event with optional data
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[EventBus] Error in listener for "${event}":`, e);
                }
            }
        }
    }

    /**
     * Remove all listeners for an event, or all events
     * @param {string} [event]
     */
    clear(event) {
        if (event) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
    }

    /**
     * Debug: list all registered events
     */
    debug() {
        console.group('[EventBus] Registered Events');
        for (const [event, listeners] of this._listeners) {
            console.log(`  ${event}: ${listeners.size} listener(s)`);
        }
        console.groupEnd();
    }
}

// Singleton
export const EventBus = new EventBusClass();

// Event name constants to avoid typos
export const Events = {
    // Game lifecycle
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_OVER: 'game:over',
    GAME_RESET: 'game:reset',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',

    // Player
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_HEAL: 'player:heal',
    PLAYER_MODE_CHANGE: 'player:modeChange',
    PLAYER_DEATH: 'player:death',

    // Combat
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_KILLED: 'enemy:killed',
    ENEMY_DAMAGED: 'enemy:damaged',
    BULLET_FIRED: 'bullet:fired',
    BULLET_HIT: 'bullet:hit',

    // Build
    BUILD_ENTER: 'build:enter',
    BUILD_EXIT: 'build:exit',
    BUILD_PLACE: 'build:place',
    BUILD_REMOVE: 'build:remove',

    // Resources
    SCRAP_COLLECTED: 'scrap:collected',
    SCRAP_DROPPED: 'scrap:dropped',
    SCRAP_CHANGED: 'scrap:changed',

    // Drones
    DRONE_SPAWN: 'drone:spawn',
    DRONE_RETURN: 'drone:return',
    DRONE_DESTROYED: 'drone:destroyed',

    // UI
    HUD_UPDATE: 'hud:update',
    SCORE_CHANGED: 'score:changed',
};
