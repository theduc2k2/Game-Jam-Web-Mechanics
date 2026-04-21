/**
 * CombatSystem.js — Turret targeting, bullet movement, damage application
 */

import * as THREE from 'three';
import { COMBAT, SCORING, PLAYER } from '../core/Config.js';
import { GameState } from '../state/GameState.js';
import { SceneManager } from '../core/SceneManager.js';
import { BulletFactory } from '../entities/BulletFactory.js';
import { ScrapFactory } from '../entities/ScrapFactory.js';
import { EventBus, Events } from '../core/EventBus.js';
import { randomInt } from '../utils/MathUtils.js';

export class CombatSystem {
    /**
     * @param {Object} player - player entity data
     * @param {Function} createExplosion - particle system callback
     */
    constructor(player, createExplosion) {
        this.player = player;
        this.createExplosion = createExplosion;
    }

    /**
     * Update all combat logic
     */
    update(dt) {
        if (GameState.isBuildMode) return;

        this._updateTurrets();
        this._updateBullets();
    }

    /**
     * Player turrets auto-aim and fire
     * @private
     */
    _updateTurrets() {
        const turrets = GameState.activeTurrets;
        const enemies = GameState.enemies;
        const playerPos = this.player.group.position;

        turrets.forEach(turret => {
            let nearestEnemy = null;
            let minDist = GameState.isStationary ? COMBAT.TURRET_RANGE_SIEGE : COMBAT.TURRET_RANGE_MOBILE;
            const turretWorldPos = turret.mesh.getWorldPosition(new THREE.Vector3());

            enemies.forEach(e => {
                const dist = turretWorldPos.distanceTo(e.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearestEnemy = e;
                }
            });

            if (nearestEnemy) {
                turret.mesh.lookAt(nearestEnemy.position);
                const fireDelay = turret.type === 'machine_gun' ? COMBAT.MACHINE_GUN_FIRE_DELAY : COMBAT.MISSILE_FIRE_DELAY;
                if (Date.now() - turret.lastShotTime > fireDelay) {
                    const bullet = BulletFactory.create(turret, nearestEnemy.position, true);
                    SceneManager.add(bullet);
                    GameState.bullets.push(bullet);
                    turret.lastShotTime = Date.now();
                }
            } else {
                turret.mesh.quaternion.slerp(new THREE.Quaternion(), 0.1);
            }
        });
    }

    /**
     * Move bullets, check collisions
     * @private
     */
    _updateBullets() {
        const bullets = GameState.bullets;
        const enemies = GameState.enemies;
        const playerPos = this.player.group.position;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.position.add(b.velocity);

            // Out of range
            if (b.position.distanceTo(playerPos) > COMBAT.BULLET_MAX_DISTANCE) {
                this._removeBullet(b, i);
                continue;
            }

            if (b.isPlayerBullet) {
                this._checkPlayerBulletHits(b, i);
            } else {
                this._checkEnemyBulletHits(b, i);
            }
        }
    }

    /**
     * @private
     */
    _checkPlayerBulletHits(b, bulletIndex) {
        const enemies = GameState.enemies;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (b.position.distanceTo(e.position) < COMBAT.BULLET_HIT_RADIUS) {
                e.health -= b.isMissile ? COMBAT.MISSILE_DAMAGE : COMBAT.MACHINE_GUN_DAMAGE;
                this.createExplosion(b.position, b.isMissile ? 0xff4400 : 0x00ffff);
                this._removeBullet(b, bulletIndex);

                if (e.health <= 0) {
                    this.createExplosion(e.position, 0xffaa00);
                    GameState.kills++;
                    GameState.score += SCORING.KILL_BONUS;

                    const dropCount = randomInt(SCORING.SCRAP_DROP_MIN, SCORING.SCRAP_DROP_MAX);
                    const scraps = ScrapFactory.createMultiple(e.position, dropCount);
                    scraps.forEach(s => {
                        SceneManager.add(s);
                        GameState.droppedScraps.push(s);
                    });

                    this._removeEnemy(e, j);
                    EventBus.emit(Events.ENEMY_KILLED, { position: e.position.clone() });
                }
                return; // bullet consumed
            }
        }

        // Missile random self-destruct far from player
        if (b.isMissile && Math.random() < 0.01 && b.position.distanceTo(this.player.group.position) > 100) {
            this.createExplosion(b.position, 0xff4400);
            this._removeBullet(b, bulletIndex);
        }
    }

    /**
     * @private
     */
    _checkEnemyBulletHits(b, bulletIndex) {
        const playerPos = this.player.group.position;
        const hitRange = GameState.isStationary ? PLAYER.HIT_RANGE_SIEGE : PLAYER.HIT_RANGE_MOBILE;

        // Hit player
        if (b.position.distanceTo(playerPos) < hitRange) {
            GameState.damagePlayer(COMBAT.ENEMY_BULLET_DAMAGE);
            this.createExplosion(b.position, 0xff0000);
            this._removeBullet(b, bulletIndex);
            return;
        }

        // Hit drones
        for (let d = GameState.activeDrones.length - 1; d >= 0; d--) {
            const drone = GameState.activeDrones[d];
            if (b.position.distanceTo(drone.position) < 1.5) {
                this.createExplosion(drone.position, 0x00ccff);
                if (drone.target) drone.target.targeted = false;
                if (drone.laserLine) SceneManager.remove(drone.laserLine);
                this._removeDrone(drone, d);
                this._removeBullet(b, bulletIndex);
                return;
            }
        }
    }

    /** @private */
    _removeBullet(b, index) {
        SceneManager.remove(b);
        GameState.bullets.splice(index, 1);
        b.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
    }

    /** @private */
    _removeEnemy(e, index) {
        SceneManager.remove(e);
        GameState.enemies.splice(index, 1);
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

    /** @private */
    _removeDrone(drone, index) {
        SceneManager.remove(drone);
        GameState.activeDrones.splice(index, 1);
        drone.traverse(child => {
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
