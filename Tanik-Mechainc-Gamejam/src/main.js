/**
 * main.js — Game entry point
 * Bootstrap the game when DOM is ready
 */

import { Game } from './core/Game.js';
import { ModelManager } from './core/ModelManager.js';

const game = new Game();

window.addEventListener('load', async () => {
    const loadingScreen = document.getElementById('global-loading');
    const loadingBar = document.getElementById('global-loading-bar');
    
    // 1. Preload 153 Models globally into RAM
    await ModelManager.init((progress) => {
        if(loadingBar) loadingBar.style.width = (progress * 100) + '%';
    });

    if(loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }

    // 2. Start Game (in Garage State)
    game.init();
    console.log('[Vanguard] Game initialized — Phase 2: Pooling Architecture');
});
