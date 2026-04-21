/**
 * SceneManager.js — Three.js scene, camera, renderer, post-processing
 * Centralizes all rendering infrastructure
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CAMERA, RENDERING, DAYNIGHT } from './Config.js';

class SceneManagerClass {
    constructor() {
        /** @type {THREE.Scene} */
        this.scene = null;
        /** @type {THREE.PerspectiveCamera} */
        this.camera = null;
        /** @type {THREE.WebGLRenderer} */
        this.renderer = null;
        /** @type {EffectComposer} */
        this.composer = null;
    }

    /**
     * Initialize the full rendering pipeline
     * @param {HTMLElement} container - DOM element to attach renderer
     */
    init(container) {
        // --- Scene ---
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(DAYNIGHT.DAY_COLOR);
        this.scene.fog = new THREE.Fog(DAYNIGHT.DAY_COLOR, DAYNIGHT.FOG_NEAR, DAYNIGHT.FOG_FAR);

        // --- Camera ---
        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );
        this.camera.position.set(0, CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);

        // --- Renderer ---
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERING.MAX_PIXEL_RATIO));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        container.appendChild(this.renderer.domElement);

        // --- Post-processing ---
        const renderPass = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            RENDERING.BLOOM_STRENGTH,
            RENDERING.BLOOM_RADIUS,
            RENDERING.BLOOM_THRESHOLD
        );
        bloomPass.threshold = RENDERING.BLOOM_THRESHOLD;
        bloomPass.strength = RENDERING.BLOOM_STRENGTH;
        bloomPass.radius = RENDERING.BLOOM_RADIUS;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);

        // --- Resize handler ---
        window.addEventListener('resize', this._onResize.bind(this));
    }

    /**
     * Add object to scene
     * @param {THREE.Object3D} object
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Remove object from scene
     * @param {THREE.Object3D} object
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * Render one frame via composer
     */
    render() {
        this.composer.render();
    }

    /**
     * Get the renderer's DOM element (for input event binding)
     * @returns {HTMLCanvasElement}
     */
    get domElement() {
        return this.renderer.domElement;
    }

    /**
     * Handle window resize
     * @private
     */
    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }

    /**
     * Dispose all rendering resources
     */
    dispose() {
        window.removeEventListener('resize', this._onResize.bind(this));
        this.renderer.dispose();
        this.composer.dispose();
    }
}

// Singleton
export const SceneManager = new SceneManagerClass();
