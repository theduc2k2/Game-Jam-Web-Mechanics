/**
 * BulletFactory.js — Bullet/missile creation
 * Factory Pattern for different projectile types
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { COMBAT } from '../core/Config.js';

export class BulletFactory {
    /**
     * Create a bullet group
     * @param {Object} turret - turret data { mesh, type }
     * @param {THREE.Vector3} targetPosition
     * @param {boolean} isPlayerBullet
     * @returns {THREE.Group} bullet group with velocity, type flags
     */
    static create(turret, targetPosition, isPlayerBullet = true) {
        const RM = ResourceManager;

        const gunPos = new THREE.Vector3();
        turret.mesh.getWorldPosition(gunPos);
        gunPos.y += 0.5;

        const direction = new THREE.Vector3().subVectors(targetPosition, gunPos).normalize();
        const bulletGroup = new THREE.Group();
        bulletGroup.position.copy(gunPos);
        bulletGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
        bulletGroup.isPlayerBullet = isPlayerBullet;

        if (isPlayerBullet) {
            if (turret.type === 'missile') {
                const head = new THREE.Mesh(RM.getGeometry('bulletLarge'), RM.getMaterial('bulletMissile'));
                const trail = new THREE.Mesh(RM.getGeometry('trailLarge'), RM.getMaterial('bulletMissileTrail'));
                trail.translateY(-0.75).rotateX(Math.PI / 2);
                bulletGroup.add(head, trail);
                bulletGroup.velocity = direction.clone().multiplyScalar(COMBAT.MISSILE_SPEED);
                bulletGroup.isMissile = true;
            } else {
                const head = new THREE.Mesh(RM.getGeometry('bulletSmall'), RM.getMaterial('bulletMachineGun'));
                const trail = new THREE.Mesh(RM.getGeometry('trailSmall'), RM.getMaterial('bulletMachineGunTrail'));
                trail.translateY(-1.5).rotateX(Math.PI / 2);
                bulletGroup.add(head, trail);
                bulletGroup.velocity = direction.clone().multiplyScalar(COMBAT.MACHINE_GUN_SPEED);
            }
        } else {
            const head = new THREE.Mesh(RM.getGeometry('bulletMedium'), RM.getMaterial('bulletEnemy'));
            const trail = new THREE.Mesh(RM.getGeometry('trailMedium'), RM.getMaterial('bulletEnemyTrail'));
            trail.translateY(-1.0).rotateX(Math.PI / 2);
            bulletGroup.add(head, trail);
            bulletGroup.velocity = direction.clone().multiplyScalar(COMBAT.ENEMY_BULLET_SPEED);
        }

        return bulletGroup;
    }
}
