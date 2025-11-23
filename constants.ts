
import { HeroData, LootBoxConfig } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 1200; // World size
export const VIEWPORT_WIDTH = window.innerWidth;
export const VIEWPORT_HEIGHT = window.innerHeight;

// Base fallback stats (mostly for bots)
export const PLAYER_SPEED = 5;
export const PROJECTILE_SPEED = 12;
export const BOT_SPEED = 3.5;

export const PLAYER_RADIUS = 24;
export const PROJECTILE_RADIUS = 8;
export const GEM_RADIUS = 12;

export const RELOAD_TIME = 40; // Frames
export const MAX_AMMO = 3;
export const DAMAGE = 340;
export const MAX_HEALTH = 4000;

export const COLORS = {
  blueTeam: '#3b82f6', // Tailwind blue-500
  redTeam: '#ef4444', // Tailwind red-500
  gem: '#a855f7', // Tailwind purple-500
  wall: '#78350f', // Tailwind amber-900
  grass: '#22c55e', // Tailwind green-500 (with opacity)
  text: '#ffffff',
  uiBg: 'rgba(0,0,0,0.6)'
};

export const INITIAL_SPAWN_GEMS = 5;
export const GEM_SPAWN_INTERVAL = 300; // Frames

// Define Heroes
export const HERO_ROSTER: HeroData[] = [
  {
    id: 'scout',
    name: 'Scout',
    price: 0,
    color: '#3b82f6', // Standard Blue
    hp: 3800,
    speed: 5.5,
    damage: 360,
    reloadTime: 40,
    range: 550,
    description: 'Balanced fighter. Good for beginners.',
    icon: '🔫'
  },
  {
    id: 'tank',
    name: 'Heavy',
    price: 150,
    color: '#1e40af', // Dark Blue
    hp: 6500,
    speed: 3.5,
    damage: 480,
    reloadTime: 55,
    range: 400,
    description: 'High health tank. Slow but tough.',
    icon: '🛡️'
  },
  {
    id: 'sniper',
    name: 'Hawk',
    price: 300,
    color: '#60a5fa', // Light Blue
    hp: 2800,
    speed: 4.5,
    damage: 900,
    reloadTime: 70,
    range: 850,
    description: 'Low HP, massive damage at long range.',
    icon: '🦅'
  },
  {
    id: 'blaze',
    name: 'Blaze',
    price: 600,
    color: '#ef4444', // Red-500
    hp: 4200,
    speed: 5.0,
    damage: 200,
    reloadTime: 12,
    range: 350,
    description: 'Rapid fire madness! Short range but high DPS.',
    icon: '🔥'
  },
  {
    id: 'speedster',
    name: 'Volt',
    price: 500,
    color: '#fbbf24', // Amber/Yellowish
    hp: 3200,
    speed: 7.5,
    damage: 280,
    reloadTime: 25,
    range: 450,
    description: 'Extremely fast. Run circles around enemies.',
    icon: '⚡'
  },
  {
    id: 'frost',
    name: 'Frost',
    price: 1000,
    color: '#06b6d4', // Cyan-500
    hp: 5200,
    speed: 4.0,
    damage: 440,
    reloadTime: 45,
    range: 550,
    description: 'Steady and durable. Controls the battlefield.',
    icon: '❄️'
  },
  {
    id: 'assassin',
    name: 'Shade',
    price: 1200,
    color: '#581c87', // Purple-900
    hp: 2400,
    speed: 8.5,
    damage: 600,
    reloadTime: 30,
    range: 250,
    description: 'Ninja assassin. Very fast, deadly close range.',
    icon: '🥷'
  },
  {
    id: 'viper',
    name: 'Viper',
    price: 1500,
    color: '#65a30d', // Lime-600
    hp: 2600,
    speed: 8.0,
    damage: 350,
    reloadTime: 20,
    range: 450,
    description: 'Toxic agility. Hit and run specialist.',
    icon: '🐍'
  },
  {
    id: 'demo',
    name: 'Sparky',
    price: 800,
    color: '#f97316', // Orange-500
    hp: 4000,
    speed: 5.0,
    damage: 550,
    reloadTime: 60,
    range: 600,
    description: 'High damage output but slower reload.',
    icon: '🧨'
  },
  {
    id: 'mech',
    name: 'Golem',
    price: 2000,
    color: '#475569', // Slate-600
    hp: 8000,
    speed: 3.0,
    damage: 400,
    reloadTime: 50,
    range: 400,
    description: 'A walking fortress. Massive health pool.',
    icon: '🗿'
  },
  {
    id: 'titan',
    name: 'Titan',
    price: 3500,
    color: '#1c1917', // Stone-900
    hp: 9500,
    speed: 2.8,
    damage: 650,
    reloadTime: 65,
    range: 350,
    description: 'The ultimate tank. Nearly unstoppable.',
    icon: '🦍'
  },
  {
    id: 'nova',
    name: 'Nova',
    price: 5000,
    color: '#ec4899', // Pink-500
    hp: 3000,
    speed: 6.0,
    damage: 1100,
    reloadTime: 90,
    range: 950,
    description: 'Cosmic power. Devastating long-range blasts.',
    icon: '✨'
  }
];

export const LOOT_BOXES: LootBoxConfig[] = [
  {
    id: 'brawl_box',
    name: '브롤상자',
    price: 100,
    minCoins: 10,
    maxCoins: 50,
    heroChance: 0.05, // 5%
    color: '#3b82f6',
    icon: '📦'
  },
  {
    id: 'big_box',
    name: '대형상자',
    price: 300,
    minCoins: 40,
    maxCoins: 150,
    heroChance: 0.15, // 15%
    color: '#9333ea',
    icon: '🎁'
  },
  {
    id: 'mega_box',
    name: '메가상자',
    price: 800,
    minCoins: 150,
    maxCoins: 500,
    heroChance: 0.40, // 40%
    color: '#ef4444',
    icon: '🟥'
  }
];
