/**
 * PlayerFactory.js — Creates the player tank with transformer mechanics
 * Factory Pattern: encapsulates complex object creation
 */

import * as THREE from 'three';
import { ResourceManager } from '../core/ResourceManager.js';
import { BUILD_GRID } from '../core/Config.js';

export class PlayerFactory {
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
        const mainHull = new THREE.Mesh(RM.getGeometry('mainHull'), RM.getMaterial('playerBody'));
        mainHull.position.y = 1.0;
        mainHull.castShadow = true;
        mainHull.receiveShadow = true;
        playerBody.add(mainHull);

        // 2. Tank treads (transformable — they rotate out in siege mode)
        const treadLGroup = new THREE.Group();
        treadLGroup.position.set(-2.3, 0.75, 0);
        const treadRGroup = new THREE.Group();
        treadRGroup.position.set(2.3, 0.75, 0);

        const treadL = new THREE.Mesh(RM.getGeometry('tread'), RM.getMaterial('mechMetal'));
        treadL.position.set(-0.6, 0, 0);
        treadL.castShadow = true;
        treadLGroup.add(treadL);

        const treadR = new THREE.Mesh(RM.getGeometry('tread'), RM.getMaterial('mechMetal'));
        treadR.position.set(0.6, 0, 0);
        treadR.castShadow = true;
        treadRGroup.add(treadR);
        playerBody.add(treadLGroup, treadRGroup);

        // 3. Front/rear shields (fold down as ramps in siege mode)
        const shieldFGroup = new THREE.Group();
        shieldFGroup.position.set(0, 1.5, -2.3);
        const shieldF = new THREE.Mesh(RM.getGeometry('shield'), RM.getMaterial('mechMetal'));
        shieldF.position.set(0, -0.5, -0.2);
        shieldF.castShadow = true;
        shieldFGroup.add(shieldF);

        const shieldBGroup = new THREE.Group();
        shieldBGroup.position.set(0, 1.5, 2.3);
        const shieldB = new THREE.Mesh(RM.getGeometry('shield'), RM.getMaterial('mechMetal'));
        shieldB.position.set(0, -0.5, 0.2);
        shieldB.castShadow = true;
        shieldBGroup.add(shieldB);
        playerBody.add(shieldFGroup, shieldBGroup);

        // 4. Engine core (glowing, scales to 0 in siege)
        const engine = new THREE.Mesh(RM.getGeometry('engineCore'), RM.getMaterial('engine'));
        engine.position.set(0, 0, -2.4);
        mainHull.add(engine);

        // 4.5 Stabilizer legs and Expanded Base Components
        const stabilizers = [];
        const legGeo = new THREE.BoxGeometry(0.6, 2.0, 0.6);
        legGeo.translate(0, -1.0, 0); // Pivot at top
        const legPositions = [
            { x: -2.3, z: -2.3 },
            { x: 2.3, z: -2.3 },
            { x: -2.3, z: 2.3 },
            { x: 2.3, z: 2.3 }
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, RM.getMaterial('mechMetal'));
            leg.position.set(pos.x, 1.0, pos.z);
            leg.castShadow = true;
            playerBody.add(leg);
            stabilizers.push(leg);
        });

        // 4.6 Perimeter Fence System
        const perimeterGroup = new THREE.Group();
        playerBody.add(perimeterGroup);
        const fences = [];
        const fenceCountPerSide = 3;
        const fenceSideLength = 4.0;

        const createFenceSide = (sideIndex) => {
            const sideGroup = new THREE.Group();
            perimeterGroup.add(sideGroup);

            for (let i = 0; i < fenceCountPerSide; i++) {
                const segment = new THREE.Group();
                const pos = (i - 1) * fenceSideLength;
                segment.position.set(pos, 0, 0);
                sideGroup.add(segment);

                const mesh = new THREE.Mesh(RM.getGeometry('fenceSegment'), RM.getMaterial('fenceMat'));
                mesh.position.y = 0.6;
                mesh.castShadow = true;
                segment.add(mesh);

                const post1 = new THREE.Mesh(RM.getGeometry('fencePost'), RM.getMaterial('mechMetal'));
                post1.position.set(-2, 0.75, 0);
                const post2 = new THREE.Mesh(RM.getGeometry('fencePost'), RM.getMaterial('mechMetal'));
                post2.position.set(2, 0.75, 0);
                segment.add(post1, post2);

                fences.push(segment);
            }

            // Initial positioning tucked under
            sideGroup.rotation.y = (Math.PI / 2) * sideIndex;
            return sideGroup;
        };

        const fenceSides = [createFenceSide(0), createFenceSide(1), createFenceSide(2), createFenceSide(3)];

        // 4.7 Base Ground Details (Houses, Tents, Containers)
        const baseDetailGroup = new THREE.Group();
        playerBody.add(baseDetailGroup);
        const detailParts = [];

        const addDetail = (geo, mat, x, z, ry, finalY = 0.5) => {
            const mesh = new THREE.Mesh(RM.getGeometry(geo), RM.getMaterial(mat));
            mesh.position.set(x, -2, z); // Hide below ground initially
            mesh.rotation.y = ry;
            mesh.castShadow = true;
            baseDetailGroup.add(mesh);
            detailParts.push({ mesh, finalY });
            return mesh;
        };

        // Tents
        addDetail('tentGeo', 'militaryGreen', -5, -5, 0);
        addDetail('tentGeo', 'militaryGreen', -5, 0, 0.2);
        addDetail('tentGeo', 'militaryGreen', -5, 5, -0.2);

        // Containers
        addDetail('containerGeo', 'militaryGreen', 5, -3, Math.PI / 2);
        addDetail('containerGeo', 'mechMetal', 5, 0, Math.PI / 2);
        addDetail('containerGeo', 'militaryGreen', 5, 3, Math.PI / 2);

        // Command Radar Dish
        const radarGroup = new THREE.Group();
        radarGroup.position.set(-2, 1, -2);
        radarGroup.scale.setScalar(0.001);
        baseDetailGroup.add(radarGroup);
        const radarBase = new THREE.Mesh(RM.getGeometry('turretBase'), RM.getMaterial('turretDarkMetal'));
        const radarDish = new THREE.Mesh(RM.getGeometry('radarDish'), RM.getMaterial('turretMetal'));
        radarDish.position.y = 0.5;
        radarDish.rotation.x = -Math.PI / 6;
        radarGroup.add(radarBase, radarDish);
        detailParts.push({ mesh: radarGroup, isRadar: true });

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
        deckGroup.position.set(0, 1.6, 0);
        playerBody.add(deckGroup);

        // 8. Build platforms (3x3 grid)
        const platforms = [];
        const buildPlanes = [];
        const buildPlanesMap = new Map();
        const spacing = BUILD_GRID.SPACING;

        for (let y = 0; y < BUILD_GRID.SIZE; y++) {
            for (let x = 0; x < BUILD_GRID.SIZE; x++) {
                const px = (x - 1) * spacing;
                const pz = (y - 1) * spacing;

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
                const distFromCenter = Math.abs(x - 1) + Math.abs(y - 1);
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
        playerGroup.platforms = platforms;
        playerGroup.parts = {
            mainHull, treadLGroup, treadRGroup,
            shieldFGroup, shieldBGroup, engine,
            stabilizers, fenceSides, detailParts, radarGroup
        };

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
