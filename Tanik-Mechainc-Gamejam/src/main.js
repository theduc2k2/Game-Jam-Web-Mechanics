/**
 * main.js — Game entry point
 * Bootstrap the game when DOM is ready
 */

import { Game } from './core/Game.js';

const game = new Game();

window.addEventListener('load', () => {
    game.init();
    console.log('[Vanguard] Game initialized — Phase 1 Architecture');
});
