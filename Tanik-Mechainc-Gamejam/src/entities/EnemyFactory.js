/**
 * EnemyFactory.js — Enemy tank creation
 * Factory Pattern for scalable enemy variants
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { ENEMY } from '../core/Config.js';
import { randomRange, randomAngle } from '../utils/MathUtils.js';

export class EnemyFactory {
    /**
     * Create an enemy tank
     * @param {THREE.Vector3} playerPosition - for spawn positioning
     * @returns {THREE.Group} enemy group with custom properties
     */
    static create(playerPosition) {
        const RM = ResourceManager;
        const rivalGroup = new THREE.Group();

        // Body
        const body = new THREE.Mesh(RM.getGeometry('enemyBody'), RM.getMaterial('enemyBody'));
        body.position.y = 0.8;
        body.castShadow = true;
        rivalGroup.add(body);

        // Treads
        const treadL = new THREE.Mesh(RM.getGeometry('enemyTread'), RM.getMaterial('enemyDetail'));
        treadL.position.set(-2.0, 0.6, 0);
        treadL.castShadow = true;
        const treadR = new THREE.Mesh(RM.getGeometry('enemyTread'), RM.getMaterial('enemyDetail'));
        treadR.position.set(2.0, 0.6, 0);
        treadR.castShadow = true;
        rivalGroup.add(treadL, treadR);

        // Eye (emissive — needs unique material for per-enemy intensity)
        const eyeMat = RM.cloneMaterial('enemyEye');
        const eye = new THREE.Mesh(RM.getGeometry('enemyEye'), eyeMat);
        eye.position.set(0, 1.2, 2.3);
        rivalGroup.add(eye);
        rivalGroup.eyeMat = eyeMat;

        // Turret
        rivalGroup.turrets = [];
        const turretGroup = new THREE.Group();
        turretGroup.position.set(0, 1.8, 0);

        const base = new THREE.Mesh(RM.getGeometry('enemyTurretBase'), RM.getMaterial('enemyDetail'));
        base.castShadow = true;
        turretGroup.add(base);

        const cannon = new THREE.Mesh(RM.getGeometry('enemyCannon'), RM.getMaterial('enemyDetail'));
        cannon.position.set(0, 0.5, 0.8);
        cannon.castShadow = true;
        turretGroup.add(cannon);

        rivalGroup.add(turretGroup);
        rivalGroup.turrets.push({
            mesh: turretGroup,
            lastShotTime: Date.now() + Math.random() * 2000
        });

        // Position around player
        const angle = randomAngle();
        const radius = randomRange(ENEMY.SPAWN_RADIUS_MIN, ENEMY.SPAWN_RADIUS_MAX);
        rivalGroup.position.set(
            playerPosition.x + Math.cos(angle) * radius,
            0,
            playerPosition.z + Math.sin(angle) * radius
        );

        // Stats
        rivalGroup.health = ENEMY.HEALTH;
        rivalGroup.speed = randomRange(ENEMY.SPEED_MIN, ENEMY.SPEED_MAX);
        rivalGroup.state = 'wander';
        rivalGroup.targetAngle = randomAngle();
        rivalGroup.changeDirTime = Date.now() + randomRange(ENEMY.WANDER_DIR_CHANGE_MIN, ENEMY.WANDER_DIR_CHANGE_MAX);

        return rivalGroup;
    }
}
