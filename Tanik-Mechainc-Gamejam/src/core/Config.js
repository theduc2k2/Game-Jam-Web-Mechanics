/**
 * Config.js — All game constants & tuning values
 * Single source of truth for game balancing
 */

export const PHYSICS = {
    ACCELERATION: 0.035,
    FRICTION: 0.94,
    MAX_SPEED: 0.75,
    SIEGE_BRAKE: 0.8,
};

export const PLAYER = {
    BASE_MAX_HEALTH: 100,
    SIEGE_BONUS_HEALTH: 150,
    ARMOR_HEALTH_BONUS: 20,
    INITIAL_SCRAP: 150,
    HIT_RANGE_MOBILE: 4.5,
    HIT_RANGE_SIEGE: 6.5,
};

export const CAMERA = {
    OFFSET_Y: 45,
    OFFSET_Z: 40,
    FOLLOW_LERP: 0.1,
    BUILD_OFFSET_Y: 25,
    BUILD_OFFSET_Z: 15,
    FOV: 50,
    NEAR: 0.1,
    FAR: 1000,
};

export const COMBAT = {
    MACHINE_GUN_FIRE_DELAY: 150,
    MISSILE_FIRE_DELAY: 1000,
    MACHINE_GUN_SPEED: 4.0,
    MISSILE_SPEED: 1.5,
    ENEMY_BULLET_SPEED: 2.0,
    MACHINE_GUN_DAMAGE: 15,
    MISSILE_DAMAGE: 50,
    ENEMY_BULLET_DAMAGE: 15,
    ENEMY_FIRE_DELAY: 1500,
    TURRET_RANGE_MOBILE: 120,
    TURRET_RANGE_SIEGE: 160,
    BULLET_MAX_DISTANCE: 250,
    BULLET_HIT_RADIUS: 5.0,
};

export const ENEMY = {
    MAX_COUNT: 6,
    SPAWN_INTERVAL: 3500,
    SPAWN_RADIUS_MIN: 120,
    SPAWN_RADIUS_MAX: 180,
    HEALTH: 150,
    SPEED_MIN: 0.15,
    SPEED_MAX: 0.30,
    AGGRO_RANGE: 150,
    ATTACK_RANGE_MOBILE: 80,
    ATTACK_RANGE_SIEGE: 90,
    DESPAWN_DISTANCE: 350,
    WANDER_DIR_CHANGE_MIN: 2000,
    WANDER_DIR_CHANGE_MAX: 5000,
    TURN_SPEED_CHASE: 0.08,
    TURN_SPEED_WANDER: 0.03,
    WANDER_SPEED_FACTOR: 0.7,
};

export const DRONE = {
    MAX_COUNT: 3,
    SPEED: 0.8,
    HARVEST_TICKS: 60,
    HARVEST_DAMAGE: 10,
    PICKUP_RANGE: 2.0,
    RETURN_RANGE: 4.0,
    SEARCH_RANGE_MOBILE: 80,
    SEARCH_RANGE_SIEGE: 150,
    COLLISION_RANGE: 3.0,
    TURN_SPEED: 0.2,
};

export const ITEMS = {
    machine_gun: { cost: 15, type: 'weapon' },
    missile: { cost: 30, type: 'weapon' },
    armor: { cost: 10, type: 'defense' },
};

export const BUILD_GRID = {
    SIZE: 3,
    SPACING: 1.4,
    INITIAL_DATA: [
        [null, 'machine_gun', null],
        ['armor', null, 'armor'],
        [null, null, null]
    ],
    // Tower heights by distance from center
    HEIGHTS: {
        0: 3.5,  // Center = tallest
        1: 2.0,  // Cross adjacent
        2: 1.0,  // Corners = shortest
    }
};

export const ENVIRONMENT = {
    GROUND_SIZE: 2000,
    GRID_DIVISIONS: 100,
    OBJECT_COUNT: 150,
    TREE_PROBABILITY: 0.7,
    SPAWN_RADIUS_MIN: 20,
    SPAWN_RADIUS_MAX: 400,
    TREE_HEALTH: 30,
    TREE_VALUE: 5,
    ROCK_HEALTH: 50,
    ROCK_VALUE: 10,
};

export const PARTICLES = {
    EXPLOSION_COUNT: 15,
    EXPLOSION_VELOCITY: 3,
    EXPLOSION_DECAY: 0.04,
    DUST_PROBABILITY: 0.4,
    DUST_DECAY: 0.02,
};

export const DAYNIGHT = {
    SPEED: 0.0015,
    INITIAL_TIME: Math.PI / 4,
    DAY_COLOR: 0x87CEEB,
    NIGHT_COLOR: 0x050510,
    FOG_NEAR: 120,
    FOG_FAR: 350,
};

export const RENDERING = {
    SHADOW_MAP_SIZE: 2048,
    SHADOW_CAMERA_SIZE: 80,
    SHADOW_BIAS: -0.0005,
    BLOOM_THRESHOLD: 0.90,
    BLOOM_STRENGTH: 0.8,
    BLOOM_RADIUS: 0.5,
    MAX_PIXEL_RATIO: 2,
};

export const SCORING = {
    DISTANCE_FACTOR: 0.04,
    KILL_BONUS: 15,
    SCRAP_DROP_MIN: 4,
    SCRAP_DROP_MAX: 10,
    SCRAP_VALUE_MIN: 3,
    SCRAP_VALUE_MAX: 7,
    REFUND_RATIO: 0.5,
};

export const TRANSFORM_ANIM = {
    DEPLOY_LERP: 0.06,
    RETRACT_LERP: 0.06,
    PLATFORM_LERP: 0.08,
};
