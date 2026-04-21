/**
 * PhysicsSystem.js — Player velocity, acceleration, friction
 */

import * as THREE from 'three';
import { InputManager } from '../core/InputManager.js';
import { PHYSICS } from '../core/Config.js';
import { GameState } from '../state/GameState.js';

export class PhysicsSystem {
    /**
     * @param {Object} player - player entity data
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Update player physics
     * @param {number} dt - delta time in seconds (unused currently, kept for future)
     */
    update(dt) {
        if (GameState.isBuildMode) return;

        const velocity = this.player.velocity;
        const group = this.player.group;
        const body = this.player.body;

        if (!GameState.isStationary) {
            // Apply input forces
            const force = InputManager.getMovementForce(PHYSICS.ACCELERATION);
            velocity.x += force.x;
            velocity.z += force.z;

            // Apply friction
            velocity.multiplyScalar(PHYSICS.FRICTION);

            // Cap speed
            if (velocity.length() > PHYSICS.MAX_SPEED) {
                velocity.setLength(PHYSICS.MAX_SPEED);
            }

            // Move player
            group.position.x += velocity.x;
            group.position.z += velocity.z;

            // Score from distance
            GameState.score += velocity.length() * 0.04;

            // Rotation smoothing toward velocity direction
            if (velocity.lengthSq() > 0.001) {
                const targetAngle = Math.atan2(velocity.x, velocity.z);
                let diff = targetAngle - body.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                body.rotation.y += diff * 0.15;

                // Bouncing effect based on speed
                group.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * (velocity.length() * 0.5);
            } else {
                group.position.y = THREE.MathUtils.lerp(group.position.y, 0, 0.1);
            }
        } else {
            // Siege mode: brake to stop
            velocity.multiplyScalar(PHYSICS.SIEGE_BRAKE);
            group.position.x += velocity.x;
            group.position.z += velocity.z;
            group.position.y = THREE.MathUtils.lerp(group.position.y, 0, 0.1);
        }
    }
}
