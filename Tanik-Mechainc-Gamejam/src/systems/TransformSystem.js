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

        // --- Stage 1: Stabilization & Expansion (dp 0.0 - 0.4) ---
        const s1 = Math.max(0, Math.min(1, dp / 0.4));

        // Treads slide out aggressively to widen the base
        parts.treadLGroup.position.x = -2.3 - (s1 * 4.5);
        parts.treadRGroup.position.x = 2.3 + (s1 * 4.5);
        parts.treadLGroup.rotation.z = s1 * -(Math.PI / 2);
        parts.treadRGroup.rotation.z = s1 * (Math.PI / 2);
        parts.treadLGroup.position.y = 0.75 - (s1 * 0.25);
        parts.treadRGroup.position.y = 0.75 - (s1 * 0.25);

        // Shields unfold to become ground ramps
        parts.shieldFGroup.rotation.x = s1 * (Math.PI / 1.5);
        parts.shieldBGroup.rotation.x = s1 * -(Math.PI / 1.5);
        parts.shieldFGroup.position.y = 1.5 - (s1 * 1.0);
        parts.shieldBGroup.position.y = 1.5 - (s1 * 1.0);
        parts.shieldFGroup.position.z = -2.3 - (s1 * 2.0);
        parts.shieldBGroup.position.z = 2.3 + (s1 * 2.0);

        // Main Hull sinks for stability
        parts.mainHull.position.y = 1.0 - (s1 * 0.5);
        this.player.deckGroup.position.y = 1.6 - (s1 * 0.5);

        // --- Stage 2: Perimeter Deployment (dp 0.4 - 0.7) ---
        const s2 = Math.max(0, Math.min(1, (dp - 0.4) / 0.3));

        if (parts.fenceSides) {
            parts.fenceSides.forEach((side, i) => {
                // Slide out fence sides to form a large perimeter
                const dist = 6.0 + (s2 * 10.0);
                side.position.z = dist;
                side.scale.setScalar(Math.max(0.001, s2));
            });
        }

        // --- Stage 3: Interior Logistics (dp 0.6 - 0.9) ---
        const s3 = Math.max(0, Math.min(1, (dp - 0.6) / 0.3));

        if (parts.detailParts) {
            parts.detailParts.forEach(detail => {
                if (!detail.isRadar) {
                    // Rise from underground
                    const targetY = detail.finalY || 0.5;
                    detail.mesh.position.y = -2 + (s3 * (targetY + 2));
                    detail.mesh.scale.setScalar(Math.max(0.001, s3));
                }
            });
        }

        // --- Stage 4: Command & Comms (dp 0.8 - 1.0) ---
        const s4 = Math.max(0, Math.min(1, (dp - 0.8) / 0.2));

        if (parts.radarGroup) {
            parts.radarGroup.scale.setScalar(s4);
            parts.radarGroup.position.y = 0.5 + (s4 * 1.5);
            // Random scanning rotation
            parts.radarGroup.rotation.y += 0.02 * s4;
        }

        // Stabilizer legs deploy during Stage 1
        if (parts.stabilizers) {
            parts.stabilizers.forEach((leg, i) => {
                const isFront = i < 2;
                const isLeft = i % 2 === 0;

                leg.rotation.z = s1 * (isLeft ? (Math.PI / 2.2) : -(Math.PI / 2.2));
                leg.rotation.x = s1 * (isFront ? -(Math.PI / 3) : (Math.PI / 3));
                leg.scale.y = 1 + (s1 * 1.2);
                leg.position.y = 1.0 - (s1 * 1.0);
            });
        }

        // Hydraulic platform towers extend (Final polish)
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
