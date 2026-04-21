/**
 * Game.js — Main game orchestrator (Singleton)
 * Wires all systems together, handles lifecycle
 */

import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { ResourceManager } from './ResourceManager.js';
import { GameLoop } from './GameLoop.js';
import { EventBus, Events } from './EventBus.js';
import { ENEMY, RENDERING, CAMERA } from './Config.js';
import { ModelManager } from './ModelManager.js';

import { GameState } from '../state/GameState.js';

import { PlayerFactory } from '../entities/PlayerFactory.js';
import { EnemyFactory } from '../entities/EnemyFactory.js';
import { EnvironmentFactory } from '../entities/EnvironmentFactory.js';

import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { AISystem } from '../systems/AISystem.js';
import { DroneSystem } from '../systems/DroneSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { DayNightSystem } from '../systems/DayNightSystem.js';
import { TransformSystem } from '../systems/TransformSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';

import { UIManager } from '../ui/UIManager.js';

export class Game {
    constructor() {
        this.player = null;
        this.sunLight = null;
        this.hemiLight = null;
        this.gridHelper = null;
        this.environmentGroup = null;
        this.hangarGroup = null;

        // Systems
        this.physicsSystem = null;
        this.combatSystem = null;
        this.aiSystem = null;
        this.droneSystem = null;
        this.particleSystem = null;
        this.dayNightSystem = null;
        this.transformSystem = null;
        this.cameraSystem = null;
        this.uiManager = null;
        this.gameLoop = null;

        this._spawnTimer = null;
    }

    /**
     * Initialize the entire game
     */
    init() {
        const container = document.getElementById('game-canvas-container');

        // 1. Core infrastructure
        ResourceManager.init();
        SceneManager.init(container);
        InputManager.init(SceneManager.domElement);

        // 2. Lighting
        this._createLighting();

        // 3. Player
        this.player = PlayerFactory.create();
        SceneManager.add(this.player.group);
        PlayerFactory.rebuildTurrets(this.player, GameState.buildGridData, GameState.activeTurrets);

        // 4. Initialize systems
        this.particleSystem = new ParticleSystem();
        const createExplosion = this.particleSystem.createExplosion.bind(this.particleSystem);
        const createDustTrail = this.particleSystem.createDustTrail.bind(this.particleSystem);

        this.physicsSystem = new PhysicsSystem(this.player);
        this.combatSystem = new CombatSystem(this.player, createExplosion);
        this.aiSystem = new AISystem(this.player, createExplosion, createDustTrail);
        this.droneSystem = new DroneSystem(this.player, createExplosion);
        this.dayNightSystem = new DayNightSystem(SceneManager.scene, {
            sunLight: this.sunLight,
            hemiLight: this.hemiLight,
            headLight: this.player.headLight,
            deckLight: this.player.deckLight
        });
        this.transformSystem = new TransformSystem(this.player);
        this.cameraSystem = new CameraSystem(SceneManager.camera, this.player, this.sunLight, this.gridHelper);

        // 6. UI
        this.uiManager = new UIManager();
        this.uiManager.init();

        // 7. Input callbacks
        this._setupInputCallbacks();
        this._setupEventListeners();

        // 8. Initial state
        GameState.recalculateHealth();

        // 9. Setup Garage State
        this._setupGarage();

        // 10. Game loop
        this.gameLoop = new GameLoop(
            (dt) => this._update(dt),
            () => this._render()
        );
        this.gameLoop.start();
    }

    /**
     * @private
     */
    _createLighting() {
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445544, 0.6);
        SceneManager.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = RENDERING.SHADOW_MAP_SIZE;
        this.sunLight.shadow.mapSize.height = RENDERING.SHADOW_MAP_SIZE;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 300;
        const d = RENDERING.SHADOW_CAMERA_SIZE;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = RENDERING.SHADOW_BIAS;
        SceneManager.add(this.sunLight);
        SceneManager.add(this.sunLight.target);
    }

    /**
     * @private
     */
    _setupInputCallbacks() {
        // Pointer events for build mode
        InputManager.setPointerCallbacks(
            (mouse) => {
                this.uiManager.buildUI.handlePointerMove(
                    SceneManager.camera, mouse, this.player.buildPlanes
                );
            },
            (mouse) => {
                this.uiManager.buildUI.handlePointerDown(
                    this.player.buildPlanesMap,
                    () => PlayerFactory.rebuildTurrets(this.player, GameState.buildGridData, GameState.activeTurrets)
                );
            }
        );
    }

    /**
     * @private
     */
    _setupEventListeners() {
        // Toggle build mode
        EventBus.on('input:toggleBuild', () => {
            if (GameState.gameOver) return;
            const entered = GameState.toggleBuildMode();

            // Show/hide hologram planes
            this.player.buildPlanes.forEach(p => p.visible = entered);

            if (entered) {
                this.cameraSystem.enterBuildMode();
            }
        });

        // Expose for HTML button onclick
        window.toggleBuildMode = () => {
            EventBus.emit('input:toggleBuild');
        };

        // Toggle siege mode
        EventBus.on('input:toggleMode', () => {
            if (GameState.isBuildMode || GameState.gameOver) return;

            const wasStationary = GameState.isStationary;
            GameState.toggleMode();
            this.particleSystem.createExplosion(this.player.group.position, 0x8f7a66);

            // Return drones when leaving siege
            if (wasStationary && !GameState.isStationary) {
                GameState.activeDrones.forEach(d => {
                    d.state = 'returning';
                    if (d.target) d.target.targeted = false;
                    if (d.laserLine) SceneManager.remove(d.laserLine);
                });
            }
        });

        // Restart
        EventBus.on('input:restart', () => {
            if (!GameState.gameOver) return;
            this._resetGame();
        });

        // Deploy to Combat
        window.deployTank = () => {
            GameState.startCombat();
        };

        EventBus.on('scene:combat', () => {
            this._transitionToCombat();
        });
    }

    /**
     * @private
     */
    _setupGarage() {
        // UI
        document.querySelector('.hud').style.display = 'none';
        document.getElementById('build-ui').style.display = 'none';
        document.getElementById('build-overlay-text').style.display = 'none';
        document.getElementById('garage-ui').style.display = 'block';

        // Aesthetics
        SceneManager.scene.background = new THREE.Color(0x050510);
        SceneManager.scene.fog.color.setHex(0x050510);
        SceneManager.scene.fog.near = 50;
        SceneManager.scene.fog.far = 150;

        // Add Hangar
        this.hangarGroup = new THREE.Group();
        const baseHangar = ModelManager.get('hangar_largeA') || new THREE.Group();
        // Scale hangar up slightly to contain larger 5x5 tank
        baseHangar.scale.set(1.5, 1.5, 1.5);
        this.hangarGroup.add(baseHangar);

        // Add Spotlight pointing at chassis
        const spotLight = new THREE.SpotLight(0x00ffcc, 5.0);
        spotLight.position.set(0, 20, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.target = this.player.group;
        this.hangarGroup.add(spotLight);
        
        SceneManager.add(this.hangarGroup);

        // Auto-enter build mode for orbit camera
        if (!GameState.isBuildMode) {
            GameState.toggleBuildMode();
            this.player.buildPlanes.forEach(p => p.visible = true);
            this.cameraSystem.enterBuildMode();
        }
    }

    /**
     * @private
     */
    _transitionToCombat() {
        // Dark space background
        SceneManager.scene.background = new THREE.Color(0x121a2e);
        SceneManager.scene.fog.color.setHex(0x121a2e);
        SceneManager.scene.fog.near = 100;
        SceneManager.scene.fog.far = 280;

        // UI
        document.getElementById('garage-ui').style.display = 'none';
        document.querySelector('.hud').style.display = 'block';
        document.getElementById('build-overlay-text').style.display = 'none';

        // Remove Hangar
        if (this.hangarGroup) {
            SceneManager.remove(this.hangarGroup);
            this.hangarGroup = null;
        }

        // Setup Combat Environment
        const env = EnvironmentFactory.create();
        this.environmentGroup = env.environmentGroup;
        this.gridHelper = env.gridHelper;
        GameState.harvestables = env.harvestables;

        SceneManager.add(env.ground);
        SceneManager.add(this.gridHelper);
        SceneManager.add(this.environmentGroup);
        
        // Update systems with newly built environment objects
        this.cameraSystem.gridHelper = this.gridHelper;

        // Exit build mode
        if (GameState.isBuildMode) {
            GameState.toggleBuildMode();
            this.player.buildPlanes.forEach(p => p.visible = false);
        }

        // Start gameplay
        this._spawnTimer = setInterval(() => this._spawnEnemy(), ENEMY.SPAWN_INTERVAL);
    }

    /**
     * @private
     */
    _spawnEnemy() {
        if (GameState.gameOver || GameState.isBuildMode) return;
        if (GameState.enemies.length >= ENEMY.MAX_COUNT) return;

        const enemy = EnemyFactory.create(this.player.group.position);
        SceneManager.add(enemy);
        GameState.enemies.push(enemy);
    }

    /**
     * @private
     */
    _update(dt) {
        if (GameState.gameOver) return;

        this.dayNightSystem.update(dt);
        this.transformSystem.update(dt);

        if (!GameState.isBuildMode) {
            this.physicsSystem.update(dt);

            // Dust trail from player movement
            if (this.player.velocity.length() > 0.1 && !GameState.isStationary) {
                this.particleSystem.createDustTrail(
                    this.player.group.position.x,
                    this.player.group.position.z
                );
            }

            this.cameraSystem.update(dt);
            this.combatSystem.update(dt);
            this.aiSystem.update(dt);
            this.droneSystem.update(dt);
        }

        this.particleSystem.update(dt);
        this.uiManager.update();
    }

    /**
     * @private
     */
    _render() {
        SceneManager.render();
    }

    /**
     * @private
     */
    _resetGame() {
        // Clean up entities
        const cleanArray = (arr) => {
            while (arr.length > 0) {
                const obj = arr[0];
                SceneManager.remove(obj);
                arr.splice(0, 1);
                if (obj.traverse) {
                    obj.traverse(child => {
                        if (child.isMesh) {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                                else child.material.dispose();
                            }
                        }
                    });
                }
            }
        };

        cleanArray(GameState.enemies);
        cleanArray(GameState.bullets);
        cleanArray(GameState.particles);
        cleanArray(GameState.dustTrailParticles);
        cleanArray(GameState.droppedScraps);
        cleanArray(GameState.lasers);

        // Clean drones + their lasers
        GameState.activeDrones.forEach(d => {
            if (d.laserLine) SceneManager.remove(d.laserLine);
        });
        cleanArray(GameState.activeDrones);

        // Clean and recreate environment
        GameState.harvestables.forEach(h => {
            if (h.parent) h.parent.remove(h);
        });
        GameState.harvestables = [];
        if (this.environmentGroup) SceneManager.remove(this.environmentGroup);

        const env = EnvironmentFactory.create();
        this.environmentGroup = env.environmentGroup;
        GameState.harvestables = env.harvestables;
        SceneManager.add(this.environmentGroup);

        // Reset state
        GameState.reset();
        this.player.group.position.set(0, 0, 0);
        this.player.velocity.set(0, 0, 0);

        // Rebuild turrets
        PlayerFactory.rebuildTurrets(this.player, GameState.buildGridData, GameState.activeTurrets);
        GameState.recalculateHealth();

        EventBus.emit(Events.GAME_RESET);
    }
}
