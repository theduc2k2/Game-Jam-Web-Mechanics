/**
 * TransformSystem.js — Transformer deploy/retract animation
 */

import * as THREE from 'three';
import { TRANSFORM_ANIM } from '../core/Config.js';
import { GameState } from '../state/GameState.js';

export class TransformSystem {
    /**
     * @param {Object} player - player entity data
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Update transformer animation based on deploy progress
     */
    update(dt) {
        // Lerp deploy progress
        if (GameState.isStationary) {
            GameState.deployProgress = THREE.MathUtils.lerp(GameState.deployProgress, 1, TRANSFORM_ANIM.DEPLOY_LERP);
        } else {
            GameState.deployProgress = THREE.MathUtils.lerp(GameState.deployProgress, 0, TRANSFORM_ANIM.RETRACT_LERP);
        }

        const dp = GameState.deployProgress;
        const parts = this.player.parts;
        if (!parts) return;

        // Handle base components
        if (parts.treadL) {
            parts.treadL.position.x = THREE.MathUtils.lerp(-4.5, -6.5, dp);
            parts.treadR.position.x = THREE.MathUtils.lerp(4.5, 6.5, dp);

            parts.mainHull.position.y = THREE.MathUtils.lerp(1.0, 2.5, dp);
            this.player.deckGroup.position.y = parts.mainHull.position.y + 0.75; 

            const stabScale = THREE.MathUtils.lerp(0.001, 1.0, dp);
            parts.stabF.scale.setScalar(stabScale);
            parts.stabB.scale.setScalar(stabScale);
            parts.stabF.position.set(0, 0.5, THREE.MathUtils.lerp(0, 5.5, dp));
            parts.stabB.position.set(0, 0.5, THREE.MathUtils.lerp(0, -5.5, dp));

            parts.towers.forEach((t, i) => {
                const signX = (i % 2 === 0) ? 1 : -1;
                const signZ = (i < 2) ? 1 : -1;
                t.position.set(
                    THREE.MathUtils.lerp(0, signX * 4.5, dp),
                    THREE.MathUtils.lerp(1.0, 1.5, dp),
                    THREE.MathUtils.lerp(0, signZ * 4.5, dp)
                );
                t.scale.setScalar(stabScale);
            });

            parts.basePlat.scale.set(stabScale, 1, stabScale);
            parts.basePlat.position.y = THREE.MathUtils.lerp(1.0, 0.25, dp);

            if (parts.engine) parts.engine.scale.setScalar(Math.max(0.001, 1 - dp));
        }

        // Hydraulic platform towers extend (Final polish)
        if (this.player.platforms) {
            this.player.platforms.forEach(plat => {
                const targetY = plat.hasItem && GameState.isStationary ? plat.targetHeight : 0;
                const currentY = THREE.MathUtils.lerp(plat.group.position.y, targetY, TRANSFORM_ANIM.PLATFORM_LERP);
                plat.group.position.y = currentY;

                if (currentY > 0.01) {
                    plat.pillar.visible = true;
                    plat.pillar.scale.setScalar(1);
                    plat.pillar.scale.y = currentY;
                } else {
                    plat.pillar.visible = false;
                }
            });
        }
    }
}
