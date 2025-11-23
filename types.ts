
export interface Vector2 {
  x: number;
  y: number;
}

export interface HeroData {
  id: string;
  name: string;
  price: number;
  color: string;
  hp: number;
  speed: number;
  damage: number;
  reloadTime: number;
  range: number;
  description: string;
  icon: string; // Emoji or simple text representation
}

export interface LootBoxConfig {
  id: string;
  name: string; // Korean name
  price: number;
  minCoins: number;
  maxCoins: number;
  heroChance: number; // 0 to 1
  color: string;
  icon: string;
}

export interface Entity {
  id: string;
  type: 'player' | 'bot' | 'gem' | 'obstacle' | 'bullet';
  pos: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  dead: boolean;
}

export interface Character extends Entity {
  type: 'player' | 'bot';
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  reloadTimer: number;
  gems: number;
  kills: number;
  team: 'blue' | 'red';
  angle: number; // Facing direction in radians
  superCharge: number; // 0-100
  
  // Hero specific stats (snapshots)
  heroId?: string;
  baseSpeed: number;
}

export interface Projectile extends Entity {
  type: 'bullet';
  ownerId: string;
  damage: number;
  team: 'blue' | 'red';
  range: number;
  distanceTraveled: number;
}

export interface Gem extends Entity {
  type: 'gem';
}

export interface Particle {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  life: number; // 0-1
  decay: number;
  color: string;
  size: number;
}

export type GameMode = 'gem_rush' | 'deathmatch' | 'boss_hunt';

export interface GameState {
  isPlaying: boolean;
  gameOver: boolean;
  winner: 'blue' | 'red' | null;
  entities: (Character | Projectile | Gem)[];
  particles: Particle[];
  camera: Vector2;
  score: { blue: number; red: number };
  matchTime: number;
  messages: GameMessage[];
}

export interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'ai';
  timestamp: number;
}

export enum JoystickType {
  MOVEMENT = 'MOVEMENT',
  AIM = 'AIM'
}