/**
 * MathUtils.js — Common math helpers
 * Avoids repeated inline math across systems
 */

/**
 * Wrap angle difference to [-PI, PI]
 * @param {number} diff - angle difference in radians
 * @returns {number} wrapped difference
 */
export function wrapAngle(diff) {
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 * @param {number} a - start
 * @param {number} b - end
 * @param {number} t - factor [0, 1]
 * @returns {number}
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Random float in range [min, max]
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Random integer in range [min, max] inclusive
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random angle in radians [0, 2*PI)
 * @returns {number}
 */
export function randomAngle() {
    return Math.random() * Math.PI * 2;
}

/**
 * Get position on circle
 * @param {number} angle - radians
 * @param {number} radius
 * @returns {{x: number, z: number}}
 */
export function circlePosition(angle, radius) {
    return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
    };
}
