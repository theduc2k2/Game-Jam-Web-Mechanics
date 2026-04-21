/**
 * EnvironmentFactory.js — Space terrain with Kenney modular tile system
 * Creates a floating space island using terrain tiles snapped together
 */

import * as THREE from 'three';
import { ModelManager } from '../core/ModelManager.js';
import { ENVIRONMENT } from '../core/Config.js';
import { randomAngle, randomRange } from '../utils/MathUtils.js';

export class EnvironmentFactory {
    /**
     * Measure the actual tile size from the terrain.glb model
     * @returns {number} tile width/depth in world units
     */
    static _measureTileSize() {
        const test = ModelManager.get('terrain');
        if (!test) return 4; // fallback for Kenney standard
        const box = new THREE.Box3().setFromObject(test);
        const size = box.getSize(new THREE.Vector3());
        console.log('[EnvironmentFactory] Measured terrain tile:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
        return Math.max(size.x, size.z);
    }

    /**
     * Create the full space environment
     * @returns {{ environmentGroup: THREE.Group, harvestables: Array, ground: THREE.Mesh, gridHelper: THREE.GridHelper }}
     */
    static create() {
        const NATIVE_TILE = EnvironmentFactory._measureTileSize(); // ~1 unit for Kenney
        const TILE_SCALE = 6; // Scale each tile up 6x
        const TILE_SIZE = NATIVE_TILE * TILE_SCALE; // Effective tile = 6 units
        const HALF = 20; // tiles from center → 41x41 grid ≈ 246 units wide
        const ISLAND_WIDTH = (HALF * 2 + 1) * TILE_SIZE;
        console.log('[EnvironmentFactory] Native tile =', NATIVE_TILE, 'Scale =', TILE_SCALE, 'Effective =', TILE_SIZE, 'Island =', ISLAND_WIDTH.toFixed(1));

        const environmentGroup = new THREE.Group();
        const harvestables = [];

        // ─── 1. ISLAND SURFACE (flat orange plane matching Kenney terrain color) ───
        const islandGeo = new THREE.PlaneGeometry(ISLAND_WIDTH, ISLAND_WIDTH);
        const islandMat = new THREE.MeshStandardMaterial({
            color: 0xc4783e, // Kenney terrain warm orange-brown
            roughness: 0.95,
            metalness: 0.0,
        });
        const islandPlane = new THREE.Mesh(islandGeo, islandMat);
        islandPlane.rotation.x = -Math.PI / 2;
        islandPlane.position.y = 0.01;
        islandPlane.receiveShadow = true;
        environmentGroup.add(islandPlane);

        // ─── 2. EDGE TILES (terrain_side / terrain_sideCliff along perimeter) ───
        // North edge (cliff faces outward = -Z)
        for (let i = -HALF; i <= HALF; i++) {
            EnvironmentFactory._placeEdge(environmentGroup, 'terrain_side',
                i * TILE_SIZE, -HALF * TILE_SIZE, Math.PI, TILE_SCALE);
        }
        // South edge (cliff faces +Z)
        for (let i = -HALF; i <= HALF; i++) {
            EnvironmentFactory._placeEdge(environmentGroup, 'terrain_side',
                i * TILE_SIZE, HALF * TILE_SIZE, 0, TILE_SCALE);
        }
        // West edge (cliff faces -X)
        for (let i = -HALF + 1; i < HALF; i++) {
            EnvironmentFactory._placeEdge(environmentGroup, 'terrain_side',
                -HALF * TILE_SIZE, i * TILE_SIZE, Math.PI / 2, TILE_SCALE);
        }
        // East edge (cliff faces +X)
        for (let i = -HALF + 1; i < HALF; i++) {
            EnvironmentFactory._placeEdge(environmentGroup, 'terrain_side',
                HALF * TILE_SIZE, i * TILE_SIZE, -Math.PI / 2, TILE_SCALE);
        }

        // ─── 3. CORNER TILES ───
        const corners = [
            { x: -HALF, z: -HALF, rot: Math.PI / 2 },   // NW
            { x:  HALF, z: -HALF, rot: Math.PI },        // NE
            { x: -HALF, z:  HALF, rot: 0 },              // SW
            { x:  HALF, z:  HALF, rot: -Math.PI / 2 },   // SE
        ];
        corners.forEach(c => {
            EnvironmentFactory._placeEdge(environmentGroup, 'terrain_sideCorner',
                c.x * TILE_SIZE, c.z * TILE_SIZE, c.rot, TILE_SCALE);
        });

        // ─── 4. INTERIOR TERRAIN VARIETY (ramps, road tiles scattered inside) ───
        for (let i = 0; i < 15; i++) {
            const gx = Math.floor(Math.random() * (HALF * 2 - 6)) - HALF + 3;
            const gz = Math.floor(Math.random() * (HALF * 2 - 6)) - HALF + 3;
            const variants = ['terrain_ramp', 'terrain_rampLarge', 'terrain_roadStraight', 'terrain_roadCorner', 'terrain_roadEnd'];
            const name = variants[Math.floor(Math.random() * variants.length)];
            const tile = ModelManager.get(name);
            if (!tile) continue;
            tile.position.set(gx * TILE_SIZE, 0, gz * TILE_SIZE);
            tile.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
            tile.scale.setScalar(TILE_SCALE);
            tile.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
            environmentGroup.add(tile);
        }

        // ─── 5. HARVESTABLE ROCKS & CRYSTALS ───
        const maxSpawn = Math.min((HALF - 2) * TILE_SIZE, ENVIRONMENT.SPAWN_RADIUS_MAX);
        for (let i = 0; i < ENVIRONMENT.OBJECT_COUNT; i++) {
            const angle = randomAngle();
            const radius = randomRange(ENVIRONMENT.SPAWN_RADIUS_MIN, maxSpawn);

            const rockVariants = ['rock', 'rock_largeA', 'rock_largeB', 'rock_crystals',
                                  'rock_crystalsLargeA', 'rocks_smallA', 'rocks_smallB'];
            const modelName = rockVariants[Math.floor(Math.random() * rockVariants.length)];
            const harvestObj = ModelManager.get(modelName);
            if (!harvestObj) continue;

            harvestObj.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            harvestObj.rotation.y = Math.random() * Math.PI * 2;
            const rockScale = 3 + Math.random() * 3; // 3x to 6x scale for visibility
            harvestObj.scale.setScalar(rockScale);

            harvestObj.isHarvestable = true;
            harvestObj.targeted = false;
            harvestObj.type = 'rock';
            harvestObj.health = ENVIRONMENT.ROCK_HEALTH;
            harvestObj.value = ENVIRONMENT.ROCK_VALUE;

            environmentGroup.add(harvestObj);
            harvestables.push(harvestObj);
        }

        // ─── 6. DECORATIVE CRATERS & DEBRIS (non-harvestable) ───
        for (let i = 0; i < 40; i++) {
            const angle = randomAngle();
            const radius = randomRange(15, maxSpawn);
            const decoVariants = ['crater', 'craterLarge', 'meteor_half', 'bones'];
            const deco = ModelManager.get(decoVariants[Math.floor(Math.random() * decoVariants.length)]);
            if (!deco) continue;
            deco.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
            deco.rotation.y = Math.random() * Math.PI * 2;
            const decoScale = 3 + Math.random() * 4;
            deco.scale.setScalar(decoScale);
            deco.traverse(n => { if (n.isMesh) n.receiveShadow = true; });
            environmentGroup.add(deco);
        }

        // ─── 7. DARK VOID GROUND (shadow catcher below the island) ───
        const groundGeo = new THREE.PlaneGeometry(2000, 2000);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 1.0 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;

        // ─── 8. GRID HELPER (hidden for space theme) ───
        const gridHelper = new THREE.GridHelper(1, 1, 0x000000, 0x000000);
        gridHelper.visible = false;

        return { environmentGroup, harvestables, ground, gridHelper };
    }

    /**
     * Place a single edge/corner tile
     */
    static _placeEdge(parent, tileName, x, z, rotation, scale = 1) {
        const tile = ModelManager.get(tileName);
        if (!tile) return;
        tile.position.set(x, 0, z);
        tile.rotation.y = rotation;
        tile.scale.setScalar(scale);
        tile.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        parent.add(tile);
    }
}
