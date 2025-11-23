
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Character, Projectile, Gem, Vector2, GameMessage, 
  Particle, JoystickType, Entity, GameMode, HeroData
} from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_RADIUS, PROJECTILE_RADIUS, 
  PROJECTILE_SPEED, PLAYER_SPEED, BOT_SPEED, GEM_RADIUS,
  COLORS, MAX_AMMO, RELOAD_TIME, DAMAGE, MAX_HEALTH
} from '../constants';
import { getAnnouncerCommentary } from '../services/geminiService';
import Joystick from './Joystick';

// Helper math
const dist = (a: Vector2, b: Vector2) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
const normalize = (v: Vector2): Vector2 => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
};

interface GameCanvasProps {
  onGameOver: (winner: 'blue' | 'red') => void;
  onScoreUpdate: (blue: number, red: number) => void;
  onMessage: (msg: string) => void;
  mode: GameMode;
  heroConfig: HeroData;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onScoreUpdate, onMessage, mode, heroConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Inputs
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<Vector2>({ x: 0, y: 0 });
  const mouseDownRef = useRef<boolean>(false);
  
  // Mobile Inputs
  const moveStickRef = useRef<Vector2>({ x: 0, y: 0 });
  const aimStickRef = useRef<Vector2>({ x: 0, y: 0 });
  const lastAimStickRef = useRef<Vector2>({ x: 1, y: 0 }); // Store last direction for shooting on release
  const isAimingRef = useRef<boolean>(false);

  // Game State References (Mutable for performance)
  const playerRef = useRef<Character>({
    id: 'player',
    type: 'player',
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 200 },
    velocity: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    color: heroConfig.color,
    dead: false,
    health: heroConfig.hp,
    maxHealth: heroConfig.hp,
    ammo: MAX_AMMO,
    maxAmmo: MAX_AMMO,
    reloadTimer: 0,
    gems: 0,
    kills: 0,
    team: 'blue',
    angle: -Math.PI / 2,
    superCharge: 0,
    heroId: heroConfig.id,
    baseSpeed: heroConfig.speed
  });

  const entitiesRef = useRef<(Character | Projectile | Gem)[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameStateRef = useRef({
    gameOver: false,
    gemSpawnTimer: 0,
    startTime: Date.now(),
    teamKills: { blue: 0, red: 0 }
  });

  const cameraRef = useRef<Vector2>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1); // Track current zoom scale
  
  // Initial Setup
  useEffect(() => {
    // Reset entities
    entitiesRef.current = [];
    playerRef.current.health = heroConfig.hp;
    playerRef.current.maxHealth = heroConfig.hp;
    playerRef.current.baseSpeed = heroConfig.speed;
    playerRef.current.color = heroConfig.color;
    playerRef.current.heroId = heroConfig.id;
    playerRef.current.dead = false;
    playerRef.current.ammo = MAX_AMMO;
    playerRef.current.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 200 };
    playerRef.current.gems = 0;
    playerRef.current.kills = 0;

    // Reset state
    gameStateRef.current = {
      gameOver: false,
      gemSpawnTimer: 0,
      startTime: Date.now(),
      teamKills: { blue: 0, red: 0 }
    };

    // Mode specific setup
    if (mode === 'gem_rush') {
       for (let i = 0; i < 5; i++) spawnGem(true);
       
       entitiesRef.current.push(
         createBot('bot1', 'red', { x: 100, y: 100 }),
         createBot('bot2', 'red', { x: CANVAS_WIDTH - 100, y: 100 }),
         createBot('bot3', 'red', { x: CANVAS_WIDTH / 2, y: 200 }),
         createBot('ally1', 'blue', { x: CANVAS_WIDTH / 2 - 100, y: CANVAS_HEIGHT - 100 })
       );
    } 
    else if (mode === 'deathmatch') {
       // More enemies
       entitiesRef.current.push(
         createBot('bot1', 'red', { x: 100, y: 100 }),
         createBot('bot2', 'red', { x: CANVAS_WIDTH - 100, y: 100 }),
         createBot('bot3', 'red', { x: CANVAS_WIDTH / 2, y: 200 }),
         createBot('bot4', 'red', { x: 200, y: 200 }),
         createBot('ally1', 'blue', { x: CANVAS_WIDTH / 2 - 100, y: CANVAS_HEIGHT - 100 }),
         createBot('ally2', 'blue', { x: CANVAS_WIDTH / 2 + 100, y: CANVAS_HEIGHT - 100 })
       );
    }
    else if (mode === 'boss_hunt') {
       // Spawn BOSS
       const boss = createBot('boss', 'red', { x: CANVAS_WIDTH/2, y: 200 });
       boss.radius = 60;
       boss.maxHealth = 25000;
       boss.health = 25000;
       boss.color = '#7f1d1d'; // Dark red
       entitiesRef.current.push(boss);

       // Allies
       entitiesRef.current.push(
         createBot('ally1', 'blue', { x: CANVAS_WIDTH / 2 - 100, y: CANVAS_HEIGHT - 100 }),
         createBot('ally2', 'blue', { x: CANVAS_WIDTH / 2 + 100, y: CANVAS_HEIGHT - 100 })
       );
    }

    // Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.key.toLowerCase()] = false;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };
    const handleMouseDown = () => mouseDownRef.current = true;
    const handleMouseUp = () => mouseDownRef.current = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Start Loop
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, heroConfig]); // Reset when mode or hero changes

  const createBot = (id: string, team: 'blue' | 'red', pos: Vector2): Character => ({
    id,
    type: 'bot',
    pos,
    velocity: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    color: team === 'blue' ? COLORS.blueTeam : COLORS.redTeam,
    dead: false,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    ammo: MAX_AMMO,
    maxAmmo: MAX_AMMO,
    reloadTimer: 0,
    gems: 0,
    kills: 0,
    team,
    angle: team === 'blue' ? -Math.PI / 2 : Math.PI / 2,
    superCharge: 0,
    baseSpeed: BOT_SPEED
  });

  const spawnGem = (random: boolean) => {
    const pos = random 
      ? { x: CANVAS_WIDTH * 0.2 + Math.random() * CANVAS_WIDTH * 0.6, y: CANVAS_HEIGHT * 0.3 + Math.random() * CANVAS_HEIGHT * 0.4 }
      : { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
      
    entitiesRef.current.push({
      id: `gem-${Date.now()}-${Math.random()}`,
      type: 'gem',
      pos,
      velocity: { x: 0, y: 0 },
      radius: GEM_RADIUS,
      color: COLORS.gem,
      dead: false
    });
  };

  const spawnParticles = (pos: Vector2, color: string, count: number) => {
    for(let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 1.0,
        decay: 0.05 + Math.random() * 0.05,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const shoot = (actor: Character, targetPos?: Vector2, manualDirection?: Vector2) => {
    if (actor.ammo <= 0 || actor.reloadTimer > 0) return;

    actor.ammo--;
    
    // Use Hero specific reload time if player, else default
    const reload = actor.type === 'player' ? heroConfig.reloadTime : RELOAD_TIME;
    actor.reloadTimer = reload;

    let dir: Vector2;
    
    if (manualDirection) {
      dir = manualDirection;
    } else if (targetPos) {
      dir = normalize({ x: targetPos.x - actor.pos.x, y: targetPos.y - actor.pos.y });
    } else {
      dir = { x: Math.cos(actor.angle), y: Math.sin(actor.angle) };
    }

    // Use Hero specific damage/range if player
    const dmg = actor.type === 'player' ? heroConfig.damage : DAMAGE;
    const rng = actor.type === 'player' ? heroConfig.range : 600;

    entitiesRef.current.push({
      id: `bullet-${actor.id}-${Date.now()}`,
      type: 'bullet',
      ownerId: actor.id,
      team: actor.team,
      pos: { 
        x: actor.pos.x + dir.x * (actor.radius + 5), 
        y: actor.pos.y + dir.y * (actor.radius + 5) 
      },
      velocity: { x: dir.x * PROJECTILE_SPEED, y: dir.y * PROJECTILE_SPEED },
      radius: PROJECTILE_RADIUS,
      color: actor.team === 'blue' ? (actor.type === 'player' ? heroConfig.color : '#60a5fa') : '#f87171', 
      dead: false,
      damage: dmg,
      range: rng,
      distanceTraveled: 0
    });
  };

  const updateGame = () => {
    if (gameStateRef.current.gameOver) return;

    const player = playerRef.current;
    const zoom = scaleRef.current;

    // --- PLAYER INPUT ---
    let dx = 0;
    let dy = 0;

    // Keyboard
    if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
    if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
    if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
    if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

    // Mobile Joystick Override
    if (moveStickRef.current.x !== 0 || moveStickRef.current.y !== 0) {
      dx = moveStickRef.current.x;
      dy = moveStickRef.current.y;
    }

    // Normalize movement
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx*dx + dy*dy);
      const speed = len > 1 ? player.baseSpeed : player.baseSpeed * len;
      
      if (len > 0) {
        player.velocity.x = (dx / len) * speed;
        player.velocity.y = (dy / len) * speed;
      }
    } else {
      player.velocity = { x: 0, y: 0 };
    }

    // Update Position
    player.pos.x += player.velocity.x;
    player.pos.y += player.velocity.y;

    // Map Bounds
    player.pos.x = Math.max(PLAYER_RADIUS, Math.min(CANVAS_WIDTH - PLAYER_RADIUS, player.pos.x));
    player.pos.y = Math.max(PLAYER_RADIUS, Math.min(CANVAS_HEIGHT - PLAYER_RADIUS, player.pos.y));

    // Aiming
    // Mobile Aim Stick
    if (isAimingRef.current) {
       const aimX = aimStickRef.current.x;
       const aimY = aimStickRef.current.y;
       if (aimX !== 0 || aimY !== 0) {
         player.angle = Math.atan2(aimY, aimX);
         lastAimStickRef.current = normalize({ x: aimX, y: aimY });
       }
    } else if (!isMobile()) {
      // Desktop Mouse
      // We need to convert mouse screen position to world relative to camera
      const screenPlayerX = (player.pos.x - cameraRef.current.x) * zoom;
      const screenPlayerY = (player.pos.y - cameraRef.current.y) * zoom;
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      player.angle = Math.atan2(my - screenPlayerY, mx - screenPlayerX);
    }

    // Shooting (Desktop)
    if (mouseDownRef.current && !isMobile()) {
      shoot(player);
    }
    
    // Reload Logic
    if (player.reloadTimer > 0) player.reloadTimer--;
    else if (player.ammo < player.maxAmmo) {
      player.ammo++;
      const reload = player.type === 'player' ? heroConfig.reloadTime : RELOAD_TIME;
      player.reloadTimer = reload * 0.5;
      if (player.ammo > player.maxAmmo) player.ammo = player.maxAmmo;
    }

    // --- ENTITIES UPDATE ---
    entitiesRef.current.forEach(ent => {
      if (ent.dead) return;

      // Bot Logic
      if (ent.type === 'bot') {
        const bot = ent as Character;
        
        let target: Entity | null = null;
        let minD = Infinity;

        if (mode === 'gem_rush') {
          entitiesRef.current.filter(e => e.type === 'gem' && !e.dead).forEach(g => {
            const d = dist(bot.pos, g.pos);
            if (d < minD && d < 400) {
              minD = d;
              target = g;
            }
          });
        }

        if (!target) {
           if (bot.team === 'red') {
             const d = dist(bot.pos, player.pos);
             if (d < 600) target = player;
           } else {
             entitiesRef.current.filter(e => e.type === 'bot' && (e as Character).team === 'red' && !e.dead).forEach(e => {
               const d = dist(bot.pos, e.pos);
               if (d < 600) target = e;
             });
           }
        }

        if (mode === 'boss_hunt' && bot.id === 'boss') {
           target = player;
        }

        if (target) {
          const moveDir = normalize({ x: target.pos.x - bot.pos.x, y: target.pos.y - bot.pos.y });
          const speed = bot.id === 'boss' ? BOT_SPEED * 0.6 : BOT_SPEED;
          const d = dist(bot.pos, target.pos);

          if (target.type !== 'gem' && d < 200 && bot.id !== 'boss') {
             bot.pos.x -= moveDir.x * speed * 0.5;
             bot.pos.y -= moveDir.y * speed * 0.5;
          } else {
             bot.pos.x += moveDir.x * speed;
             bot.pos.y += moveDir.y * speed;
          }

          if (target.type !== 'gem') {
             bot.angle = Math.atan2(target.pos.y - bot.pos.y, target.pos.x - bot.pos.x);
             shoot(bot, target.pos);
          }
        } else {
          const center = { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 };
          const dir = normalize({ x: center.x - bot.pos.x, y: center.y - bot.pos.y });
          bot.pos.x += dir.x * BOT_SPEED * 0.5;
          bot.pos.y += dir.y * BOT_SPEED * 0.5;
        }

        if (bot.reloadTimer > 0) bot.reloadTimer--;
        else if (bot.ammo < bot.maxAmmo) {
           bot.ammo++;
           bot.reloadTimer = RELOAD_TIME;
        }

        bot.pos.x = Math.max(PLAYER_RADIUS, Math.min(CANVAS_WIDTH - PLAYER_RADIUS, bot.pos.x));
        bot.pos.y = Math.max(PLAYER_RADIUS, Math.min(CANVAS_HEIGHT - PLAYER_RADIUS, bot.pos.y));
      }

      // Projectile Logic
      if (ent.type === 'bullet') {
        const b = ent as Projectile;
        b.pos.x += b.velocity.x;
        b.pos.y += b.velocity.y;
        b.distanceTraveled += Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);

        if (b.distanceTraveled > b.range || 
            b.pos.x < 0 || b.pos.x > CANVAS_WIDTH || 
            b.pos.y < 0 || b.pos.y > CANVAS_HEIGHT) {
          b.dead = true;
        }
      }
    });

    // --- COLLISIONS ---
    entitiesRef.current.filter(e => e.type === 'bullet' && !e.dead).forEach(b => {
      const bullet = b as Projectile;
      
      if (bullet.team !== player.team && !player.dead && dist(bullet.pos, player.pos) < PLAYER_RADIUS + PROJECTILE_RADIUS) {
        bullet.dead = true;
        damageCharacter(player, bullet.damage, bullet.ownerId);
      }

      entitiesRef.current.filter(e => e.type === 'bot' && !e.dead).forEach(bot => {
        const character = bot as Character;
        if (bullet.team !== character.team && dist(bullet.pos, character.pos) < character.radius + PROJECTILE_RADIUS) {
          bullet.dead = true;
          damageCharacter(character, bullet.damage, bullet.ownerId);
        }
      });
    });

    if (mode === 'gem_rush') {
      const chars = [player, ...entitiesRef.current.filter(e => e.type === 'bot' && !e.dead)] as Character[];
      chars.forEach(c => {
        entitiesRef.current.filter(g => g.type === 'gem' && !g.dead).forEach(g => {
           if (dist(c.pos, g.pos) < c.radius + g.radius) {
             g.dead = true;
             c.gems++;
             spawnParticles(g.pos, COLORS.gem, 5);
           }
        });
      });
    }

    entitiesRef.current = entitiesRef.current.filter(e => !e.dead);
    particlesRef.current.forEach(p => {
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.life -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    if (mode === 'gem_rush') {
      gameStateRef.current.gemSpawnTimer++;
      if (gameStateRef.current.gemSpawnTimer > 300) {
         spawnGem(false);
         gameStateRef.current.gemSpawnTimer = 0;
      }
    }

    if (mode === 'gem_rush') {
        let blueGems = player.gems;
        let redGems = 0;
        entitiesRef.current.forEach(e => {
          if (e.type === 'bot') {
            const b = e as Character;
            if (b.team === 'blue') blueGems += b.gems;
            else redGems += b.gems;
          }
        });
        onScoreUpdate(blueGems, redGems);

        if (blueGems >= 10) endGame('blue');
        else if (redGems >= 10) endGame('red');
    } 
    else if (mode === 'deathmatch') {
        onScoreUpdate(gameStateRef.current.teamKills.blue, gameStateRef.current.teamKills.red);
        if (gameStateRef.current.teamKills.blue >= 10) endGame('blue');
        if (gameStateRef.current.teamKills.red >= 10) endGame('red');
    }
    else if (mode === 'boss_hunt') {
        const boss = entitiesRef.current.find(e => e.id === 'boss');
        if (!boss) endGame('blue'); 
        const bossHP = boss ? Math.ceil(((boss as Character).health / 25000) * 100) : 0;
        onScoreUpdate(100, bossHP);
    }
  };

  const damageCharacter = (char: Character, amount: number, attackerId: string) => {
    char.health -= amount;
    spawnParticles(char.pos, char.color, 3);
    
    if (char.health <= 0) {
      char.dead = true;
      
      if (mode === 'deathmatch') {
         if (char.team === 'red') gameStateRef.current.teamKills.blue++;
         else gameStateRef.current.teamKills.red++;
      }

      if (mode === 'gem_rush') {
        const gemsToDrop = Math.min(5, char.gems);
        for(let i=0; i<gemsToDrop; i++) {
          entitiesRef.current.push({
            id: `gem-drop-${Math.random()}`,
            type: 'gem',
            pos: { x: char.pos.x + (Math.random()*40 - 20), y: char.pos.y + (Math.random()*40 - 20) },
            velocity: { x: 0, y: 0 },
            radius: GEM_RADIUS,
            color: COLORS.gem,
            dead: false
          });
        }
      }
      
      if (char.id === 'player') {
         endGame('red');
         triggerAnnouncer('Player Died', 'The blue team player was eliminated.');
      } else {
        if (char.id !== 'boss') {
           if (attackerId === 'player') {
             triggerAnnouncer('Enemy Eliminated', 'The player killed an enemy bot.');
           }
           
           setTimeout(() => {
             if (!gameStateRef.current.gameOver) {
                const spawnPos = char.team === 'blue' 
                   ? { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT - 100 }
                   : { x: CANVAS_WIDTH/2, y: 100 };
                entitiesRef.current.push(createBot('bot-'+Date.now(), char.team, spawnPos));
             }
           }, 3000);
        }
      }
    }
  };

  const triggerAnnouncer = async (event: string, context: string) => {
    const text = await getAnnouncerCommentary(event, context);
    if (text) onMessage(text);
  };

  const endGame = (winner: 'blue' | 'red') => {
    if (gameStateRef.current.gameOver) return;
    gameStateRef.current.gameOver = true;
    onGameOver(winner);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    
    // Calculate Zoom Scale based on viewport width
    // We want to see roughly 900 world units of width horizontally regardless of screen size
    const targetVisibleWidth = 900;
    const baseScale = Math.max(0.8, window.innerWidth / targetVisibleWidth);
    scaleRef.current = baseScale;
    
    // Set Canvas resolution to physical pixels for sharpness
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        // Reset transform happens on resize, so we handle scaling below
    }

    // Clear with background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera Calculation
    // We want player centered. 
    // ScreenCenter = (PlayerPos - CameraPos) * Scale * DPR
    // CameraPos = PlayerPos - ScreenCenter / (Scale * DPR)
    let camX = playerRef.current.pos.x - (displayWidth / 2) / baseScale;
    let camY = playerRef.current.pos.y - (displayHeight / 2) / baseScale;

    // Clamp Camera
    camX = Math.max(0, Math.min(CANVAS_WIDTH - displayWidth / baseScale, camX));
    camY = Math.max(0, Math.min(CANVAS_HEIGHT - displayHeight / baseScale, camY));
    cameraRef.current = { x: camX, y: camY };

    ctx.save();
    // Apply both HighDPI scale and Zoom scale
    const totalScale = baseScale * dpr;
    ctx.scale(totalScale, totalScale);
    ctx.translate(-camX, -camY);

    // Grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 2;
    for (let x = 0; x <= CANVAS_WIDTH; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 100) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Objectives
    if (mode === 'gem_rush') {
      ctx.fillStyle = '#2d1b4e';
      ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 40, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4; ctx.stroke();
    } else if (mode === 'boss_hunt') {
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(CANVAS_WIDTH/2 - 200, 0, 400, 400);
    }

    // Entities
    const renderList = [playerRef.current, ...entitiesRef.current].sort((a, b) => a.pos.y - b.pos.y);

    renderList.forEach(ent => {
      if (ent.dead) return;
      if (ent.type === 'player' || ent.type === 'bot') drawCharacter(ctx, ent as Character);
      else if (ent.type === 'gem') drawGem(ctx, ent as Gem);
      else if (ent.type === 'bullet') drawBullet(ctx, ent as Projectile);
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(char.pos.x, char.pos.y + 10, char.radius, char.radius * 0.6, 0, 0, Math.PI*2);
    ctx.fill();

    // Body
    ctx.fillStyle = char.color;
    ctx.beginPath(); ctx.arc(char.pos.x, char.pos.y, char.radius, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();

    // Gun
    const gunLen = char.id === 'boss' ? 50 : 35;
    const gunX = char.pos.x + Math.cos(char.angle) * gunLen;
    const gunY = char.pos.y + Math.sin(char.angle) * gunLen;
    ctx.lineWidth = char.id === 'boss' ? 12 : 8;
    ctx.strokeStyle = '#333';
    ctx.beginPath(); ctx.moveTo(char.pos.x, char.pos.y); ctx.lineTo(gunX, gunY); ctx.stroke();

    // HP Bar
    const barW = char.id === 'boss' ? 100 : 50;
    const barH = 6;
    const hpPct = Math.max(0, char.health / char.maxHealth);
    ctx.fillStyle = '#333';
    ctx.fillRect(char.pos.x - barW/2, char.pos.y - char.radius - 15, barW, barH);
    ctx.fillStyle = hpPct < 0.3 ? '#ef4444' : '#22c55e';
    ctx.fillRect(char.pos.x - barW/2, char.pos.y - char.radius - 15, barW * hpPct, barH);

    // Gems Held
    if (char.gems > 0 && mode === 'gem_rush') {
      ctx.fillStyle = COLORS.gem;
      ctx.font = 'bold 14px Rubik';
      ctx.textAlign = 'center';
      ctx.fillText(`💎 ${char.gems}`, char.pos.x, char.pos.y - char.radius - 20);
    }
  };

  const drawGem = (ctx: CanvasRenderingContext2D, gem: Gem) => {
    const glow = ctx.createRadialGradient(gem.pos.x, gem.pos.y, 5, gem.pos.x, gem.pos.y, 20);
    glow.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = glow; ctx.fillRect(gem.pos.x - 20, gem.pos.y - 20, 40, 40);
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(gem.pos.x, gem.pos.y - gem.radius);
    ctx.lineTo(gem.pos.x + gem.radius, gem.pos.y);
    ctx.lineTo(gem.pos.x, gem.pos.y + gem.radius);
    ctx.lineTo(gem.pos.x - gem.radius, gem.pos.y);
    ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
  };

  const drawBullet = (ctx: CanvasRenderingContext2D, b: Projectile) => {
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI*2); ctx.fill();
  };

  const gameLoop = (time: number) => {
    lastTimeRef.current = time;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        updateGame();
        draw(ctx);
      }
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const isMobile = () => 'ontouchstart' in window;

  const handleMoveStick = useCallback((vec: Vector2, active: boolean) => {
    moveStickRef.current = vec;
  }, []);

  const handleAimStick = useCallback((vec: Vector2, active: boolean) => {
    aimStickRef.current = vec;
    isAimingRef.current = active;
    
    if (!active) {
       const lastDir = lastAimStickRef.current;
       if (lastDir.x !== 0 || lastDir.y !== 0) {
          shoot(playerRef.current, undefined, lastDir);
       }
    }
  }, [heroConfig]); 

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full cursor-crosshair block z-0"
      />
      {/* Removed lg:hidden to ensure joysticks show on all screen sizes */}
      <div className="">
         <Joystick type={JoystickType.MOVEMENT} onMove={handleMoveStick} />
         <Joystick type={JoystickType.AIM} onMove={handleAimStick} />
      </div>
    </>
  );
};

export default GameCanvas;
