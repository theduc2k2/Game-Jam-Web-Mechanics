/**
 * BuildUI.js — Build mode shop, grid interaction, item placement
 */

import * as THREE from 'three';
import { ITEMS, SCORING } from '../core/Config.js';
import { GameState } from '../state/GameState.js';
import { ModelManager, ASSET_LIST } from '../core/ModelManager.js';
import { EventBus, Events } from '../core/EventBus.js';

export class BuildUI {
    constructor() {
        /** @type {THREE.Raycaster} */
        this._raycaster = new THREE.Raycaster();

        /** @type {THREE.Mesh|null} */
        this._hoveredPlane = null;
    }

    /**
     * Initialize build UI
     */
    init() {
        // Expose selectShopItem globally for inline onclick handlers
        window.selectShopItem = (itemId) => {
            GameState.selectedShopItem = itemId;
            
            // Update Shop UI
            document.querySelectorAll('.shop-item').forEach(el => el.classList.remove('selected'));
            const el = document.getElementById(`shop-${itemId}`);
            if (el) el.classList.add('selected');

            // Update Warehouse UI
            document.querySelectorAll('.warehouse-item').forEach(el => el.classList.remove('selected-warehouse'));
            const wel = document.getElementById(`warehouse-${itemId}`);
            if (wel) wel.classList.add('selected-warehouse');

            // Update display name
            const nameEl = document.getElementById('selected-part-name');
            if (nameEl) nameEl.innerText = "CHỌN: " + itemId.toUpperCase().replace(/_/g, ' ');
        };

        this._currentCategory = 'ALL';
        this.populateWarehouseCategories();
        this.populateWarehouse();

        // Select default
        window.selectShopItem('machine_gun');
    }

    populateWarehouseCategories() {
        const catContainer = document.getElementById('warehouse-categories');
        if (!catContainer) return;

        const cats = [
            { id: 'ALL', label: 'TẤT CẢ' },
            { id: 'WEAPONS', label: 'VŨ KHÍ' },
            { id: 'BASE', label: 'CĂN CỨ' },
            { id: 'VEHICLES', label: 'XE CỘ' },
            { id: 'TERRAIN', label: 'ĐỊA HÌNH' },
            { id: 'PROPS', label: 'VẬT THỂ' },
            { id: 'CHARS', label: 'NHÂN VẬT' }
        ];

        cats.forEach(c => {
            const btn = document.createElement('button');
            btn.className = `cat-btn px-2 py-1 text-[10px] font-mono border rounded transition ${c.id === this._currentCategory ? 'bg-cyan-700 text-white border-cyan-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-cyan-500 hover:text-white'}`;
            btn.innerText = c.label;
            btn.onclick = () => {
                this._currentCategory = c.id;
                document.querySelectorAll('.cat-btn').forEach(b => {
                    b.classList.remove('bg-cyan-700', 'text-white', 'border-cyan-500');
                    b.classList.add('bg-zinc-800', 'text-zinc-400', 'border-zinc-700');
                });
                btn.classList.add('bg-cyan-700', 'text-white', 'border-cyan-500');
                btn.classList.remove('bg-zinc-800', 'text-zinc-400', 'border-zinc-700');
                this.filterWarehouse();
            };
            catContainer.appendChild(btn);
        });
    }

    filterWarehouse() {
        const items = document.querySelectorAll('.warehouse-item');
        items.forEach(item => {
            if (this._currentCategory === 'ALL' || item.dataset.category === 'SYS' || item.dataset.category === this._currentCategory) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Dynamically fill the sidebar with 153 assets
     */
    populateWarehouse() {
        const list = document.getElementById('warehouse-list');
        if (!list) return;

        // Add special "Remove" item
        this._addWarehouseItem(list, 'remove', '🗑️', 'THÁO DỠ', 'red', 'SYS');

        ASSET_LIST.forEach(file => {
            const name = file.replace('.glb', '');
            let icon = '📦';
            let category = 'PROPS';

            if (name.startsWith('weapon') || name.startsWith('turret') || name.startsWith('rocket')) { category = 'WEAPONS'; icon = '🔫'; }
            else if (name.startsWith('corridor') || name.startsWith('hangar') || name.startsWith('platform') || name.startsWith('structure') || name.startsWith('supports') || name.startsWith('gate') || name.startsWith('chimney') || name.startsWith('stairs') || name.startsWith('pipe')) { category = 'BASE'; icon = '🏢'; }
            else if (name.startsWith('crater') || name.startsWith('meteor') || name.startsWith('rock') || name.startsWith('terrain')) { category = 'TERRAIN'; icon = '🪨'; }
            else if (name.startsWith('craft') || name.startsWith('rover') || name.startsWith('monorail')) { category = 'VEHICLES'; icon = '🚀'; }
            else if (name.startsWith('alien') || name.startsWith('astronaut')) { category = 'CHARS'; icon = '👤'; }
            else if (name.includes('machine')) icon = '⚙️';

            this._addWarehouseItem(list, name, icon, name.replace(/_/g, ' ').toUpperCase(), 'cyan', category);
        });
    }

    _addWarehouseItem(parent, id, icon, label, color, category = 'PROPS') {
        const item = document.createElement('div');
        item.id = `warehouse-${id}`;
        item.dataset.category = category;
        item.className = `warehouse-item group relative glass-panel p-3 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 border border-zinc-500/10 hover:border-cyan-500/40`;
        
        // Use 3D thumbnail if available, otherwise fallback to emoji
        const thumbUrl = ModelManager.thumbnails.get(id);
        const iconHtml = thumbUrl 
            ? `<img src="${thumbUrl}" class="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">`
            : `<div class="text-xl">${icon}</div>`;

        item.innerHTML = `
            <div class="w-12 h-12 flex items-center justify-center bg-zinc-950/40 rounded border border-white/5 group-hover:scale-110 transition-transform overflow-hidden">${iconHtml}</div>
            <div class="flex-1 overflow-hidden">
                <div class="text-[10px] text-zinc-400 font-mono tracking-wider truncate uppercase">${label}</div>
                <div class="text-[9px] text-cyan-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">COMPATIBLE</div>
            </div>
            <div class="w-1 h-1 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500 shadow-[0_0_5px_cyan] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        `;
        item.onclick = () => window.selectShopItem(id);
        parent.appendChild(item);
    }

    /**
     * Handle pointer move for build grid hover
     * @param {THREE.PerspectiveCamera} camera
     * @param {{x: number, y: number}} mouse
     * @param {THREE.Mesh[]} buildPlanes
     */
    handlePointerMove(camera, mouse, buildPlanes) {
        if (!GameState.isBuildMode) return;

        this._raycaster.setFromCamera(mouse, camera);
        const intersects = this._raycaster.intersectObjects(buildPlanes);

        // Reset previous hover
        if (this._hoveredPlane) {
            this._hoveredPlane.material.color.setHex(0x00ffcc);
            this._hoveredPlane.material.opacity = 0.15;
        }

        if (intersects.length > 0) {
            this._hoveredPlane = intersects[0].object;
            this._hoveredPlane.material.color.setHex(0xffffff);
            this._hoveredPlane.material.opacity = 0.5;
        } else {
            this._hoveredPlane = null;
        }
    }

    /**
     * Handle pointer click for item placement
     * @param {Map} buildPlanesMap - uuid → grid coords
     * @param {Function} onRebuild - callback to rebuild turrets
     */
    handlePointerDown(buildPlanesMap, onRebuild) {
        if (!GameState.isBuildMode || !GameState.selectedShopItem || !this._hoveredPlane) return;

        const gridCoords = buildPlanesMap.get(this._hoveredPlane.uuid);
        const x = gridCoords.x;
        const y = gridCoords.y;

        if (GameState.selectedShopItem === 'remove') {
            if (GameState.buildGridData[y][x]) {
                const refund = Math.floor(ITEMS[GameState.buildGridData[y][x]].cost * SCORING.REFUND_RATIO);
                GameState.addScrap(refund);
                GameState.buildGridData[y][x] = null;
                onRebuild();
                GameState.recalculateHealth();
            }
            return;
        }

        const itemConfig = ITEMS[GameState.selectedShopItem];
        
        // Garage mode skip cost check, allow any pooled model
        const isModel = ModelManager.cache.has(GameState.selectedShopItem);

        if (GameState.sceneState === 'GARAGE' || (itemConfig && GameState.scrap >= itemConfig.cost) || isModel) {
            // Refund existing item (if it has a cost)
            if (GameState.buildGridData[y][x] && ITEMS[GameState.buildGridData[y][x]]) {
                const refund = Math.floor(ITEMS[GameState.buildGridData[y][x]].cost * SCORING.REFUND_RATIO);
                GameState.addScrap(refund);
            }

            if (GameState.sceneState !== 'GARAGE' && itemConfig) {
                GameState.spendScrap(itemConfig.cost);
            }

            GameState.buildGridData[y][x] = GameState.selectedShopItem;
            onRebuild();
            GameState.recalculateHealth();
        }
    }
}
