/**
 * DroneSystem.js — Worker drone FSM (moving_to / harvesting / returning)
 */

import * as THREE from 'three';
import { DRONE } from '../core/Config.js';
import { GameState } from '../state/GameState.js';
import { SceneManager } from '../core/SceneManager.js';
import { ResourceManager } from '../core/ResourceManager.js';
import { DroneFactory } from '../entities/DroneFactory.js';
import { wrapAngle } from '../utils/MathUtils.js';

export class DroneSystem {
    /**
     * @param {Object} player - player entity data
     * @param {Function} createExplosion - particle callback
     */
    constructor(player, createExplosion) {
        this.player = player;
        this.createExplosion = createExplosion;
    }

    /**
     * Update all drones + spawn logic
     */
    update(dt) {
        if (GameState.isBuildMode) return;

        this._trySpawnDrone();
        this._updateDrones();
    }

    /**
     * @private
     */
    _trySpawnDrone() {
        if (GameState.activeDrones.length >= DRONE.MAX_COUNT) return;

        const playerPos = this.player.group.position;
        const searchRange = GameState.isStationary ? DRONE.SEARCH_RANGE_SIEGE : DRONE.SEARCH_RANGE_MOBILE;
        let target = null;

        // Priority: pick up dropped scraps first
        for (const s of GameState.droppedScraps) {
            if (!s.targeted && playerPos.distanceTo(s.position) < searchRange) {
                target = s;
                break;
            }
        }

        // If in siege mode and no scraps, harvest environment
        if (!target && GameState.isStationary) {
            for (const h of GameState.harvestables) {
                if (h.health > 0 && !h.targeted && playerPos.distanceTo(h.position) < searchRange) {
                    target = h;
                    break;
                }
            }
        }

        if (target) {
            target.targeted = true;
            const drone = DroneFactory.create(playerPos, target);
            SceneManager.add(drone);
            GameState.activeDrones.push(drone);
        }
    }

    /**
     * @private
     */
    _updateDrones() {
        const drones = GameState.activeDrones;
        const playerPos = this.player.group.position;

        for (let i = drones.length - 1; i >= 0; i--) {
            const drone = drones[i];
            const bump = Math.abs(Math.sin(Date.now() * 0.03 + i)) * 0.08;

            if (drone.state === 'moving_to') {
                this._handleMovingTo(drone, i, bump);
            } else if (drone.state === 'harvesting') {
                this._handleHarvesting(drone, i);
            } else if (drone.state === 'returning') {
                this._handleReturning(drone, i, playerPos, bump);
            }
        }
    }

    /** @private */
    _handleMovingTo(drone, index, bump) {
        if (!drone.target || (drone.target.health !== undefined && drone.target.health <= 0)) {
            drone.state = 'returning';
            if (drone.target) drone.target.targeted = false;
            return;
        }

        const dir = new THREE.Vector3().subVectors(drone.target.position, drone.position);
        const dist = dir.length();

        if (dist < DRONE.PICKUP_RANGE) {
            if (drone.target.isDropped) {
                drone.carryingValue = drone.target.value;
                // Remove scrap
                SceneManager.remove(drone.target);
                const idx = GameState.droppedScraps.indexOf(drone.target);
                if (idx > -1) GameState.droppedScraps.splice(idx, 1);
                drone.state = 'returning';
                drone.bodyMat.emissiveIntensity = 3.0;
            } else {
                drone.state = 'harvesting';
            }
        } else {
            dir.normalize();
            drone.position.add(dir.multiplyScalar(drone.speed));
            drone.position.y = 0.4 + bump;

            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = wrapAngle(targetAngle - drone.rotation.y);
            drone.rotation.y += diff * DRONE.TURN_SPEED;
        }
    }

    /** @private */
    _handleHarvesting(drone, index) {
        if (!drone.target || drone.target.health <= 0) {
            drone.state = 'returning';
            if (drone.laserLine) {
                SceneManager.remove(drone.laserLine);
                drone.laserLine = null;
            }
            return;
        }

        drone.lookAt(drone.target.position);
        drone.harvestTimer += 1;

        // Create laser line if needed
        if (!drone.laserLine) {
            const material = ResourceManager.cloneMaterial('droneLaser');
            const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            drone.laserLine = new THREE.Line(geometry, material);
            SceneManager.add(drone.laserLine);
        }

        const startPoint = drone.position.clone().add(new THREE.Vector3(0, 0.5, 0));
        const endPoint = drone.target.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        drone.laserLine.geometry.setFromPoints([startPoint, endPoint]);

        // Sparks
        if (drone.harvestTimer % 5 === 0) {
            this.createExplosion(endPoint, 0x00ffcc);
        }

        // Harvest tick
        if (drone.harvestTimer > DRONE.HARVEST_TICKS) {
            drone.target.health -= DRONE.HARVEST_DAMAGE;
            drone.harvestTimer = 0;

            if (drone.target.health <= 0) {
                this.createExplosion(drone.target.position, 0x8f7a66);
                drone.carryingValue = drone.target.value;

                // Remove harvestable
                SceneManager.remove(drone.target);
                const idx = GameState.harvestables.indexOf(drone.target);
                if (idx > -1) GameState.harvestables.splice(idx, 1);

                drone.state = 'returning';
                SceneManager.remove(drone.laserLine);
                drone.laserLine = null;
                drone.bodyMat.emissiveIntensity = 3.0;
            }
        }
    }

    /** @private */
    _handleReturning(drone, index, playerPos, bump) {
        const dir = new THREE.Vector3().subVectors(playerPos, drone.position);
        const dist = dir.length();

        if (dist < DRONE.RETURN_RANGE) {
            if (drone.carryingValue) {
                GameState.addScrap(drone.carryingValue);
            }
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
        } else {
            dir.normalize();
            drone.position.add(dir.multiplyScalar(drone.speed));
            drone.position.y = 0.4 + bump;

            const targetAngle = Math.atan2(dir.x, dir.z);
            const diff = wrapAngle(targetAngle - drone.rotation.y);
            drone.rotation.y += diff * DRONE.TURN_SPEED;
        }
    }
}
