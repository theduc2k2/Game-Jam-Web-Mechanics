/**
 * InputManager.js — Keyboard & Mouse input handling (Command Pattern)
 * Decouples raw input events from game actions
 */

import { EventBus, Events } from './EventBus.js';

class InputManagerClass {
    constructor() {
        /** @type {Object<string, boolean>} */
        this.keys = {
            w: false, a: false, s: false, d: false
        };

        /** @type {{x: number, y: number}} normalized mouse position */
        this.mouse = { x: 0, y: 0 };

        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundKeyUp = this._onKeyUp.bind(this);
        this._boundPointerMove = null;
        this._boundPointerDown = null;

        /** @type {Function|null} */
        this._pointerMoveCallback = null;
        /** @type {Function|null} */
        this._pointerDownCallback = null;
    }

    /**
     * Initialize input listeners
     * @param {HTMLCanvasElement} canvas - renderer canvas for pointer events
     */
    init(canvas) {
        this._canvas = canvas;

        document.addEventListener('keydown', this._boundKeyDown);
        document.addEventListener('keyup', this._boundKeyUp);
    }

    /**
     * Register pointer callbacks (used by BuildUI system)
     * @param {Function} onMove
     * @param {Function} onDown
     */
    setPointerCallbacks(onMove, onDown) {
        // Remove old listeners
        if (this._boundPointerMove) {
            this._canvas.removeEventListener('pointermove', this._boundPointerMove);
        }
        if (this._boundPointerDown) {
            this._canvas.removeEventListener('pointerdown', this._boundPointerDown);
        }

        this._boundPointerMove = (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            if (onMove) onMove(this.mouse, event);
        };

        this._boundPointerDown = (event) => {
            if (onDown) onDown(this.mouse, event);
        };

        this._canvas.addEventListener('pointermove', this._boundPointerMove);
        this._canvas.addEventListener('pointerdown', this._boundPointerDown);
    }

    /**
     * @private
     */
    _onKeyDown(event) {
        const code = event.code;

        // Movement keys
        if (code === 'KeyW' || code === 'ArrowUp') this.keys.w = true;
        if (code === 'KeyA' || code === 'ArrowLeft') this.keys.a = true;
        if (code === 'KeyS' || code === 'ArrowDown') this.keys.s = true;
        if (code === 'KeyD' || code === 'ArrowRight') this.keys.d = true;

        // Action keys — dispatch via EventBus
        if (code === 'KeyF') EventBus.emit('input:toggleMode');
        if (code === 'KeyB') EventBus.emit('input:toggleBuild');
        if (code === 'KeyR') EventBus.emit('input:restart');
    }

    /**
     * @private
     */
    _onKeyUp(event) {
        const code = event.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.keys.w = false;
        if (code === 'KeyA' || code === 'ArrowLeft') this.keys.a = false;
        if (code === 'KeyS' || code === 'ArrowDown') this.keys.s = false;
        if (code === 'KeyD' || code === 'ArrowRight') this.keys.d = false;
    }

    /**
     * Check if any movement key is pressed
     * @returns {boolean}
     */
    get isMoving() {
        return this.keys.w || this.keys.a || this.keys.s || this.keys.d;
    }

    /**
     * Get movement force vector (raw, not normalized)
     * @param {number} accel - acceleration value
     * @returns {{x: number, z: number}}
     */
    getMovementForce(accel) {
        let x = 0, z = 0;
        if (this.keys.w) z -= accel;
        if (this.keys.s) z += accel;
        if (this.keys.a) x -= accel;
        if (this.keys.d) x += accel;
        return { x, z };
    }

    /**
     * Dispose all listeners
     */
    dispose() {
        document.removeEventListener('keydown', this._boundKeyDown);
        document.removeEventListener('keyup', this._boundKeyUp);
        if (this._canvas && this._boundPointerMove) {
            this._canvas.removeEventListener('pointermove', this._boundPointerMove);
        }
        if (this._canvas && this._boundPointerDown) {
            this._canvas.removeEventListener('pointerdown', this._boundPointerDown);
        }
    }
}

// Singleton
export const InputManager = new InputManagerClass();
