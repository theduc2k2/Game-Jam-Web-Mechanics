/**
 * PlayerFactory.js — Creates the player tank with transformer mechanics
 * Factory Pattern: encapsulates complex object creation
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { ModelManager } from '../core/ModelManager.js';
import { BUILD_GRID } from '../core/Config.js';

export class PlayerFactory {
    static _autoFitModelToCell(wrapperGroup, rawModel) {
        if (!rawModel) return;
        
        const box = new THREE.Box3().setFromObject(rawModel);
        const size = box.getSize(new THREE.Vector3());
        if (size.x === 0 || size.y === 0 || size.z === 0) {
            wrapperGroup.add(rawModel);
            return;
        }

        const center = box.getCenter(new THREE.Vector3());

        // Reposition model inside wrapper so its bottom is sitting on Y=0 and it centers X,Z
        rawModel.position.set(-center.x + rawModel.position.x, -box.min.y + rawModel.position.y, -center.z + rawModel.position.z);

        // Preserve authentic proportions instead of aggressively stretching/shrinking everything to maxSize
        wrapperGroup.scale.setScalar(1.0);

        wrapperGroup.add(rawModel);
    }

    /**
     * Create the full player entity
     * @returns {Object} player data { group, body, deckGroup, platforms, parts, velocity }
     */
    static create() {
        const RM = ResourceManager;

        const playerGroup = new THREE.Group();
        const playerBody = new THREE.Group();
        playerGroup.add(playerBody);

        // 1. Main hull (center body)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc97a4e, roughness: 0.8, metalness: 0.2 }); 
        const treadMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, metalness: 0.5 }); 
        
        const mainHull = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.5, 7.5), bodyMat);
        mainHull.position.y = 1.0;
        mainHull.castShadow = true;
        mainHull.receiveShadow = true;
        playerBody.add(mainHull);

        // 2. Tank treads (spread wider to support 5x5 deck)
        const treadsGroup = new THREE.Group();
        playerBody.add(treadsGroup);

        const treadGeo = new THREE.BoxGeometry(1.5, 1.5, 8.5);
        const treadL = new THREE.Mesh(treadGeo, treadMat);
        treadL.position.set(-4.5, 0.75, 0);
        treadL.castShadow = true;
        
        const treadR = new THREE.Mesh(treadGeo, treadMat);
        treadR.position.set(4.5, 0.75, 0);
        treadR.castShadow = true;
        treadsGroup.add(treadL, treadR);

        // 3. Stabilizers
        const stabGeo = new THREE.BoxGeometry(4.0, 1.0, 2.0);
        const stabMat = new THREE.MeshStandardMaterial({ color: 0x7b8b94, roughness: 0.6, metalness: 0.7 }); 
        const stabF = new THREE.Mesh(stabGeo, stabMat);
        const stabB = new THREE.Mesh(stabGeo, stabMat);
        stabF.castShadow = true; stabB.castShadow = true;
        playerBody.add(stabF, stabB);

        // 4. Towers
        const towers = [];
        const towerGeo = new THREE.BoxGeometry(1.5, 3.5, 1.5);
        for(let i=0; i<4; i++) {
            const t = new THREE.Mesh(towerGeo, stabMat);
            t.castShadow = true;
            playerBody.add(t);
            towers.push(t);
        }

        // 5. Base Platform
        const basePlatMat = new THREE.MeshStandardMaterial({ color: 0x666b6c, roughness: 0.9 });
        const basePlat = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 0.5, 8), basePlatMat);
        basePlat.castShadow = true;
        playerBody.add(basePlat);

        // 6. Engine
        const engineGeo = new THREE.BoxGeometry(2.5, 0.5, 0.2);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xff3300, emissiveIntensity: 2.0 });
        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.position.set(0, 0, -3.8); 
        mainHull.add(engine);

        playerGroup.parts = { mainHull, treadL, treadR, stabF, stabB, towers, basePlat, engine };

        // 5. Headlight
        const headLight = new THREE.SpotLight(0xffeedd, 0);
        headLight.position.set(0, 2, 2.5);
        headLight.target.position.set(0, 0, 50);
        headLight.angle = Math.PI / 4;
        headLight.penumbra = 0.5;
        headLight.distance = 150;
        headLight.castShadow = true;
        playerBody.add(headLight);
        playerBody.add(headLight.target);

        // 6. Deck light
        const deckLight = new THREE.PointLight(0xffeedd, 0, 25);
        deckLight.position.set(0, 6, 0);
        playerBody.add(deckLight);

        // 7. Deck group (holds turret platforms)
        const deckGroup = new THREE.Group();
        deckGroup.position.set(0, 1.75, -0.5);
        playerBody.add(deckGroup);

        // 8. Build platforms (Dynamic Grid Size)
        const platforms = [];
        const buildPlanes = [];
        const buildPlanesMap = new Map();
        const spacing = BUILD_GRID.SPACING;
        const centerIdx = Math.floor(BUILD_GRID.SIZE / 2);

        for (let y = 0; y < BUILD_GRID.SIZE; y++) {
            for (let x = 0; x < BUILD_GRID.SIZE; x++) {
                const px = (x - centerIdx) * spacing;
                const pz = (y - centerIdx) * spacing;

                const platGroup = new THREE.Group();
                platGroup.position.set(px, 0, pz);
                deckGroup.add(platGroup);

                // Hydraulic pillar
                const pillar = new THREE.Mesh(RM.getGeometry('pillar'), RM.getMaterial('mechMetal'));
                pillar.position.y = 0;
                platGroup.add(pillar);

                // Armored pad
                const pad = new THREE.Mesh(RM.getGeometry('pad'), RM.getMaterial('playerBody'));
                pad.position.y = 0.1;
                pad.castShadow = true;
                pad.receiveShadow = true;
                platGroup.add(pad);

                // Hologram click plane for build mode
                const plane = new THREE.Mesh(RM.getGeometry('buildPlane'), RM.cloneMaterial('hologram'));
                plane.rotation.x = -Math.PI / 2;
                plane.position.set(0, 0.25, 0);
                plane.visible = false;
                platGroup.add(plane);

                buildPlanes.push(plane);
                buildPlanesMap.set(plane.uuid, { x, y });

                // Tower height based on distance from center
                const distFromCenter = Math.abs(x - centerIdx) + Math.abs(y - centerIdx);
                const tHeight = BUILD_GRID.HEIGHTS[distFromCenter] || 1.0;

                platforms.push({
                    group: platGroup,
                    pillar,
                    pad,
                    plane,
                    gridX: x,
                    gridY: y,
                    baseHeight: 0,
                    targetHeight: tHeight,
                    hasItem: false
                });
            }
        }

        // Store references on group
        // Removed parts reassignment because it was done earlier

        return {
            group: playerGroup,
            body: playerBody,
            deckGroup,
            platforms,
            buildPlanes,
            buildPlanesMap,
            parts: playerGroup.parts,
            headLight,
            deckLight,
            velocity: new THREE.Vector3(0, 0, 0)
        };
    }

    /**
     * Rebuild turret meshes on platforms based on build grid data
     * @param {Object} player - player data from create()
     * @param {Array<Array<string|null>>} gridData - build grid
     * @param {Array} activeTurrets - turret tracking array (mutated)
     */
    static rebuildTurrets(player, gridData, activeTurrets) {
        const RM = ResourceManager;

        // Clear existing turrets
        activeTurrets.length = 0;

        player.platforms.forEach(p => {
            // Remove everything except pillar, pad, plane
            const toRemove = [];
            p.group.children.forEach(child => {
                if (child !== p.pillar && child !== p.pad && child !== p.plane) {
                    toRemove.push(child);
                }
            });
            toRemove.forEach(child => {
                p.group.remove(child);
                child.traverse(c => {
                    if (c.isMesh) {
                        if (c.geometry) c.geometry.dispose();
                        if (c.material) {
                            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                            else c.material.dispose();
                        }
                    }
                });
            });
            p.hasItem = false;
        });

        // Rebuild from grid data
        for (let y = 0; y < BUILD_GRID.SIZE; y++) {
            for (let x = 0; x < BUILD_GRID.SIZE; x++) {
                const item = gridData[y][x];
                if (!item) continue;

                const platInfo = player.platforms.find(p => p.gridX === x && p.gridY === y);
                platInfo.hasItem = true;

                // Check if it's a pooled model first
                let pooledModel = ModelManager.get(item);
                
                // Temporary fix: map some items if not found
                if(!pooledModel && item === 'machine_gun') pooledModel = ModelManager.get('turret_single');
                if(!pooledModel && item === 'missile') pooledModel = ModelManager.get('turret_double');
                if(!pooledModel && item === 'armor') pooledModel = ModelManager.get('structure_closed');

                if (pooledModel) {
                    const wrapper = new THREE.Group();
                    wrapper.position.set(0, 0.2, 0); // slightly above the pad
                    
                    // Insert with exact model proportions without scaling it down
                    PlayerFactory._autoFitModelToCell(wrapper, pooledModel);

                    platInfo.group.add(wrapper);

                    // If it's a turret-like object (based on name or metadata), track it
                    if (item.includes('turret') || item.includes('gun') || item.includes('weapon') || item.includes('machine_gun') || item.includes('missile')) {
                        activeTurrets.push({
                            mesh: wrapper,
                            type: item,
                            lastShotTime: Date.now() + Math.random() * 500
                        });
                    }
                } else {
                    // Fallback for legacy procedural items
                    if (item === 'armor') {
                        const armor = new THREE.Mesh(RM.getGeometry('armorBlock'), RM.getMaterial('turretMetal'));
                        armor.position.set(0, 0.7, 0);
                        armor.castShadow = true;
                        platInfo.group.add(armor);
                    } else {
                        const turretGroup = new THREE.Group();
                        turretGroup.position.set(0, 0.4, 0);

                        const base = new THREE.Mesh(RM.getGeometry('turretBase'), RM.getMaterial('turretDarkMetal'));
                        base.castShadow = true;
                        turretGroup.add(base);

                        if (item === 'machine_gun') {
                            const gun1 = new THREE.Mesh(RM.getGeometry('machineGunBarrel'), RM.getMaterial('turretMetal'));
                            gun1.position.set(-0.2, 0.4, 0.4);
                            gun1.castShadow = true;
                            const gun2 = new THREE.Mesh(RM.getGeometry('machineGunBarrel'), RM.getMaterial('turretMetal'));
                            gun2.position.set(0.2, 0.4, 0.4);
                            gun2.castShadow = true;
                            turretGroup.add(gun1, gun2);
                        } else if (item === 'missile') {
                            const pod = new THREE.Mesh(RM.getGeometry('missilePodGeo'), RM.getMaterial('missilePod'));
                            pod.position.set(0, 0.5, 0.2);
                            pod.castShadow = true;
                            turretGroup.add(pod);
                        }
                        platInfo.group.add(turretGroup);

                        activeTurrets.push({
                            mesh: turretGroup,
                            type: item,
                            lastShotTime: Date.now() + Math.random() * 500
                        });
                    }
                }
            }
        }
    }
}
