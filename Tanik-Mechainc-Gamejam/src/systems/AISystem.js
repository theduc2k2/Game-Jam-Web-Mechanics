/**
 * AISystem.js — Enemy AI with FSM (wander/chase/attack)
 */

import * as THREE from 'three';
import { ENEMY, COMBAT } from '../core/Config.js';
import { GameState } from '../state/GameState.js';
import { SceneManager } from '../core/SceneManager.js';
import { BulletFactory } from '../entities/BulletFactory.js';
import { wrapAngle, randomAngle, randomRange } from '../utils/MathUtils.js';

export class AISystem {
    /**
     * @param {Object} player - player entity data
     * @param {Function} createExplosion
     * @param {Function} createDustTrail
     */
    constructor(player, createExplosion, createDustTrail) {
        this.player = player;
        this.createExplosion = createExplosion;
        this.createDustTrail = createDustTrail;
    }

    /**
     * Update all enemy AI
     */
    update(dt) {
        if (GameState.isBuildMode) return;

        const enemies = GameState.enemies;
        const playerPos = this.player.group.position;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const distToPlayer = e.position.distanceTo(playerPos);
            const aggroRange = ENEMY.AGGRO_RANGE;
            const attackRange = GameState.isStationary ? ENEMY.ATTACK_RANGE_SIEGE : ENEMY.ATTACK_RANGE_MOBILE;

            if (distToPlayer < aggroRange) {
                this._updateChase(e, i, distToPlayer, attackRange, playerPos);
            } else {
                this._updateWander(e, i);
            }

            // Check drone collisions
            this._checkDroneCollisions(e);

            // Despawn if too far
            if (distToPlayer > ENEMY.DESPAWN_DISTANCE) {
                SceneManager.remove(e);
                enemies.splice(i, 1);
                e.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                            else child.material.dispose();
                        }
                    }
                });
            }
        }
    }

    /**
     * @private
     */
    _updateChase(e, index, distToPlayer, attackRange, playerPos) {
        e.state = 'chase';
        e.eyeMat.emissiveIntensity = 5.0;

        const dirToPlayer = new THREE.Vector3().subVectors(playerPos, e.position).normalize();
        const targetAngle = Math.atan2(dirToPlayer.x, dirToPlayer.z);
        const diff = wrapAngle(targetAngle - e.rotation.y);
        e.rotation.y += diff * ENEMY.TURN_SPEED_CHASE;

        if (distToPlayer > attackRange) {
            e.position.x += Math.sin(e.rotation.y) * e.speed;
            e.position.z += Math.cos(e.rotation.y) * e.speed;
            this.createDustTrail(e.position.x, e.position.z);
            e.position.y = Math.abs(Math.sin(Date.now() * 0.01 + index)) * 0.2;
        } else {
            e.position.y = 0;
        }

        // Turrets fire at player
        e.turrets.forEach(turret => {
            turret.mesh.lookAt(playerPos);
            if (Date.now() - turret.lastShotTime > COMBAT.ENEMY_FIRE_DELAY) {
                const bullet = BulletFactory.create(turret, playerPos, false);
                SceneManager.add(bullet);
                GameState.bullets.push(bullet);
                turret.lastShotTime = Date.now();
            }
        });
    }

    /**
     * @private
     */
    _updateWander(e, index) {
        e.state = 'wander';
        e.eyeMat.emissiveIntensity = 1.0;

        if (Date.now() > e.changeDirTime) {
            e.targetAngle = randomAngle();
            e.changeDirTime = Date.now() + randomRange(ENEMY.WANDER_DIR_CHANGE_MIN, ENEMY.WANDER_DIR_CHANGE_MAX);
        }

        const diff = wrapAngle(e.targetAngle - e.rotation.y);
        e.rotation.y += diff * ENEMY.TURN_SPEED_WANDER;

        e.position.x += Math.sin(e.rotation.y) * (e.speed * ENEMY.WANDER_SPEED_FACTOR);
        e.position.z += Math.cos(e.rotation.y) * (e.speed * ENEMY.WANDER_SPEED_FACTOR);
        e.position.y = Math.abs(Math.sin(Date.now() * 0.01 + index)) * 0.2;
        this.createDustTrail(e.position.x, e.position.z);

        e.turrets.forEach(turret => {
            turret.mesh.quaternion.slerp(new THREE.Quaternion(), 0.05);
        });
    }

    /**
     * @private
     */
    _checkDroneCollisions(e) {
        const drones = GameState.activeDrones;
        for (let d = drones.length - 1; d >= 0; d--) {
            if (e.position.distanceTo(drones[d].position) < ENEMY.ATTACK_RANGE_MOBILE * 0.04) {
                this.createExplosion(drones[d].position, 0x00ccff);
                const drone = drones[d];
                if (drone.target) drone.target.targeted = false;
                if (drone.laserLine) SceneManager.remove(drone.laserLine);
                SceneManager.remove(drone);
                drones.splice(d, 1);
            }
        }
    }
}
