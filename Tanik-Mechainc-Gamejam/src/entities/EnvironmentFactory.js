/**
 * EnvironmentFactory.js — Trees, rocks, and harvestable objects
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { ENVIRONMENT } from '../core/Config.js';
import { randomAngle, randomRange } from '../utils/MathUtils.js';

export class EnvironmentFactory {
    /**
     * Create the full environment (ground + grid + objects)
     * @returns {{ environmentGroup: THREE.Group, harvestables: Array, ground: THREE.Mesh, gridHelper: THREE.GridHelper }}
     */
    static create() {
        const RM = ResourceManager;

        // Ground
        const ground = new THREE.Mesh(RM.getGeometry('groundPlane'), RM.getMaterial('ground'));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;

        // Grid overlay
        const gridHelper = new THREE.GridHelper(
            ENVIRONMENT.GROUND_SIZE,
            ENVIRONMENT.GRID_DIVISIONS,
            0x669944, 0x669944
        );
        gridHelper.position.y = 0.1;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;

        // Environment objects group
        const environmentGroup = new THREE.Group();
        const harvestables = [];

        for (let i = 0; i < ENVIRONMENT.OBJECT_COUNT; i++) {
            const isTree = Math.random() < ENVIRONMENT.TREE_PROBABILITY;
            let harvestObj;

            if (isTree) {
                harvestObj = EnvironmentFactory._createTree(RM);
            } else {
                harvestObj = EnvironmentFactory._createRock(RM);
            }

            const angle = randomAngle();
            const radius = randomRange(ENVIRONMENT.SPAWN_RADIUS_MIN, ENVIRONMENT.SPAWN_RADIUS_MAX);
            harvestObj.position.set(Math.cos(angle) * radius, isTree ? 0 : Math.random(), Math.sin(angle) * radius);

            harvestObj.isHarvestable = true;
            harvestObj.targeted = false;

            environmentGroup.add(harvestObj);
            harvestables.push(harvestObj);
        }

        return { environmentGroup, harvestables, ground, gridHelper };
    }

    /**
     * @private
     */
    static _createTree(RM) {
        const treeGroup = new THREE.Group();

        const trunk = new THREE.Mesh(RM.getGeometry('trunkGeo'), RM.getMaterial('treeTrunk'));
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;

        const leaves = new THREE.Mesh(RM.getGeometry('leavesGeo'), RM.getMaterial('treeLeaves'));
        leaves.position.y = 4.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;

        treeGroup.add(trunk, leaves);
        treeGroup.rotation.y = Math.random() * Math.PI;
        const scale = 0.8 + Math.random() * 0.6;
        treeGroup.scale.set(scale, scale, scale);

        treeGroup.type = 'tree';
        treeGroup.health = ENVIRONMENT.TREE_HEALTH;
        treeGroup.value = ENVIRONMENT.TREE_VALUE;

        return treeGroup;
    }

    /**
     * @private
     */
    static _createRock(RM) {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(Math.random() * 2 + 1, 0),
            RM.getMaterial('rock')
        );
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;

        rock.type = 'rock';
        rock.health = ENVIRONMENT.ROCK_HEALTH;
        rock.value = ENVIRONMENT.ROCK_VALUE;

        return rock;
    }
}
