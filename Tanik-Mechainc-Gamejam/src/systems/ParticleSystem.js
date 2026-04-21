/**
 * ParticleSystem.js — Explosions and dust trail particles
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { GameState } from '../state/GameState.js';
import { PARTICLES } from '../core/Config.js';

export class ParticleSystem {
    constructor() {
        // nothing
    }

    /**
     * Create explosion particles at position
     * @param {THREE.Vector3} position
     * @param {number} colorHex
     */
    createExplosion(position, colorHex) {
        const geo = ResourceManager.getGeometry('particleBox');

        for (let i = 0; i < PARTICLES.EXPLOSION_COUNT; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: colorHex });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * PARTICLES.EXPLOSION_VELOCITY,
                (Math.random() - 0.5) * PARTICLES.EXPLOSION_VELOCITY,
                (Math.random() - 0.5) * PARTICLES.EXPLOSION_VELOCITY
            );
            particle.life = 1.0;
            SceneManager.add(particle);
            GameState.particles.push(particle);
        }
    }

    /**
     * Create a dust trail particle
     * @param {number} x
     * @param {number} z
     */
    createDustTrail(x, z) {
        if (Math.random() > PARTICLES.DUST_PROBABILITY) return;

        const geo = ResourceManager.getGeometry('dustSphere');
        const mat = ResourceManager.cloneMaterial('dustTrail');
        const dust = new THREE.Mesh(geo, mat);
        dust.position.set(x + (Math.random() - 0.5) * 5, 0.5, z + (Math.random() - 0.5) * 5);
        dust.life = 1.0;
        dust.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2 + 0.1,
            (Math.random() - 0.5) * 0.2
        );
        SceneManager.add(dust);
        GameState.dustTrailParticles.push(dust);
    }

    /**
     * Update all particles (explosion + dust)
     */
    update(dt) {
        // Explosion particles
        const particles = GameState.particles;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.position.add(p.velocity);
            p.life -= PARTICLES.EXPLOSION_DECAY;
            p.scale.setScalar(Math.max(0.01, p.life));
            if (p.material && p.material.opacity !== undefined) {
                p.material.transparent = true;
                p.material.opacity = p.life;
            }
            if (p.life <= 0) {
                SceneManager.remove(p);
                particles.splice(i, 1);
                if (p.material) p.material.dispose();
            }
        }

        // Dust trail particles
        const dusts = GameState.dustTrailParticles;
        for (let i = dusts.length - 1; i >= 0; i--) {
            const d = dusts[i];
            d.position.add(d.velocity);
            d.life -= PARTICLES.DUST_DECAY;
            d.scale.setScalar(Math.max(0.01, d.life * 2));
            d.material.opacity = d.life * 0.6;
            if (d.life <= 0) {
                SceneManager.remove(d);
                dusts.splice(i, 1);
                if (d.material) d.material.dispose();
            }
        }

        // Dropped scraps animation
        GameState.droppedScraps.forEach(s => {
            s.rotation.x += 0.02;
            s.rotation.y += 0.03;
            s.material.emissiveIntensity = 1.0 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.5;
        });

        // Clean lasers
        const lasers = GameState.lasers;
        for (let i = lasers.length - 1; i >= 0; i--) {
            SceneManager.remove(lasers[i]);
            lasers.splice(i, 1);
        }
    }
}
