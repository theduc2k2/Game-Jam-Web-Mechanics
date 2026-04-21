/**
 * GameLoop.js — Fixed timestep game loop with RAF
 * Separates update (fixed dt) from render (variable)
 */

export class GameLoop {
    /**
     * @param {Function} updateFn - Called with fixed dt (seconds)
     * @param {Function} renderFn - Called each frame
     */
    constructor(updateFn, renderFn) {
        this._update = updateFn;
        this._render = renderFn;
        this._running = false;
        this._rafId = null;
        this._lastTime = 0;
        this._accumulator = 0;

        // Fixed 60hz update
        this._tickRate = 60;
        this._tickMs = 1000 / this._tickRate;
        this._tickSec = 1 / this._tickRate;

        // Safety cap to avoid spiral of death
        this._maxAccumulator = this._tickMs * 5;

        // Performance tracking
        this._frameCount = 0;
        this._fpsTimer = 0;
        this.fps = 60;

        this._loop = this._loop.bind(this);
    }

    /**
     * Start the game loop
     */
    start() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        this._accumulator = 0;
        this._rafId = requestAnimationFrame(this._loop);
    }

    /**
     * Stop the game loop
     */
    stop() {
        this._running = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    /**
     * @private
     */
    _loop(timestamp) {
        if (!this._running) return;
        this._rafId = requestAnimationFrame(this._loop);

        const dt = timestamp - this._lastTime;
        this._lastTime = timestamp;

        // FPS tracking
        this._frameCount++;
        this._fpsTimer += dt;
        if (this._fpsTimer >= 1000) {
            this.fps = this._frameCount;
            this._frameCount = 0;
            this._fpsTimer -= 1000;
        }

        // Accumulate time for fixed updates
        this._accumulator += dt;
        if (this._accumulator > this._maxAccumulator) {
            this._accumulator = this._maxAccumulator;
        }

        // Fixed-step game logic updates
        while (this._accumulator >= this._tickMs) {
            this._update(this._tickSec);
            this._accumulator -= this._tickMs;
        }

        // Variable-rate rendering
        this._render();
    }

    /**
     * @returns {boolean}
     */
    get isRunning() {
        return this._running;
    }
}
