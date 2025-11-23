
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameMessage, GameMode, HeroData, LootBoxConfig } from './types';
import { getAnnouncerCommentary } from './services/geminiService';
import { HERO_ROSTER, LOOT_BOXES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('gem_rush');
  const [score, setScore] = useState({ blue: 0, red: 0 });
  const [winner, setWinner] = useState<'blue' | 'red' | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [gameId, setGameId] = useState(0);

  // Persistence State
  // Save functionality is handled automatically via localStorage in useEffect hooks below.
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('brawl_coins');
    return saved ? parseInt(saved, 10) : 800; // Start with 800 coins
  });

  const [unlockedHeroes, setUnlockedHeroes] = useState<string[]>(() => {
    const saved = localStorage.getItem('brawl_unlocked');
    return saved ? JSON.parse(saved) : ['scout'];
  });

  const [selectedHeroId, setSelectedHeroId] = useState<string>(() => {
    return localStorage.getItem('brawl_selected') || 'scout';
  });

  // Reward Modal State
  const [reward, setReward] = useState<{ type: 'coins' | 'hero', value: number | string, name?: string } | null>(null);

  // Persistence Effects - Auto Save
  useEffect(() => {
    localStorage.setItem('brawl_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('brawl_unlocked', JSON.stringify(unlockedHeroes));
  }, [unlockedHeroes]);

  useEffect(() => {
    localStorage.setItem('brawl_selected', selectedHeroId);
  }, [selectedHeroId]);

  const handleStart = async () => {
    setGameId(prev => prev + 1);
    setGameState('playing');
    setScore({ blue: 0, red: 0 });
    setWinner(null);
    setMessages([]);
    
    // Welcome message
    try {
        let prompt = "The match has started.";
        if (gameMode === 'deathmatch') prompt = "Team Deathmatch started. Kill enemies.";
        if (gameMode === 'boss_hunt') prompt = "Boss Hunt started. Take down the giant robot.";
        
        const welcome = await getAnnouncerCommentary("Match Start", prompt);
        if (welcome) addMessage(welcome);
    } catch (e) {
        addMessage("BRAWL TIME!");
    }
  };

  const handleHome = () => {
    setGameState('menu');
    setScore({ blue: 0, red: 0 });
    setWinner(null);
    setMessages([]);
  };

  const handleGameOver = (winTeam: 'blue' | 'red') => {
    setWinner(winTeam);
    setGameState('gameover');

    // Award Coins
    const isWin = winTeam === 'blue';
    const earnedCoins = isWin ? 60 : 10;
    setCoins(prev => prev + earnedCoins);
    
    setTimeout(() => {
        addMessage(isWin ? `Victory! +${earnedCoins} Coins` : `Defeat... +${earnedCoins} Coins`);
    }, 500);
  };

  const handleScoreUpdate = (blue: number, red: number) => {
    setScore({ blue, red });
  };

  const addMessage = (text: string) => {
    const newMsg: GameMessage = {
      id: Date.now().toString(),
      text,
      type: 'ai',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== newMsg.id));
    }, 3000);
  };

  // Shop Logic
  const buyHero = (heroId: string, price: number) => {
    if (coins >= price && !unlockedHeroes.includes(heroId)) {
      setCoins(prev => prev - price);
      setUnlockedHeroes(prev => [...prev, heroId]);
      setSelectedHeroId(heroId); // Auto equip
    }
  };

  const selectHero = (heroId: string) => {
    if (unlockedHeroes.includes(heroId)) {
      setSelectedHeroId(heroId);
    }
  };

  // Box Opening Logic
  const openBox = (boxId: string) => {
    const box = LOOT_BOXES.find(b => b.id === boxId);
    if (!box) return;
    if (coins < box.price) {
      alert("Not enough coins!");
      return;
    }

    setCoins(prev => prev - box.price);

    // 1. Determine if we get a hero
    const lockedHeroes = HERO_ROSTER.filter(h => !unlockedHeroes.includes(h.id));
    const roll = Math.random();
    
    if (lockedHeroes.length > 0 && roll < box.heroChance) {
       // Unlock a random hero
       const newHero = lockedHeroes[Math.floor(Math.random() * lockedHeroes.length)];
       setUnlockedHeroes(prev => [...prev, newHero.id]);
       setReward({ type: 'hero', value: newHero.id, name: newHero.name });
    } else {
       // Get coins
       const coinReward = Math.floor(Math.random() * (box.maxCoins - box.minCoins + 1)) + box.minCoins;
       setCoins(prev => prev + coinReward);
       setReward({ type: 'coins', value: coinReward });
    }
  };

  const closeReward = () => {
    setReward(null);
  };

  const currentHero = HERO_ROSTER.find(h => h.id === selectedHeroId) || HERO_ROSTER[0];

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-900 select-none">
      {/* Game Layer */}
      {gameState !== 'menu' && (
        <GameCanvas 
          key={gameId}
          mode={gameMode}
          heroConfig={currentHero}
          onGameOver={handleGameOver} 
          onScoreUpdate={handleScoreUpdate}
          onMessage={addMessage}
        />
      )}

      {/* UI Layer */}
      <UIOverlay 
        gameState={gameState}
        gameMode={gameMode}
        setGameMode={setGameMode}
        score={score}
        messages={messages}
        onRestart={handleStart}
        onHome={handleHome}
        winner={winner}
        coins={coins}
        heroes={HERO_ROSTER}
        unlockedHeroes={unlockedHeroes}
        selectedHeroId={selectedHeroId}
        onBuyHero={buyHero}
        onSelectHero={selectHero}
        onOpenBox={openBox}
        reward={reward}
        onCloseReward={closeReward}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes pop-up {
            0% { transform: scale(0); }
            80% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .animate-pop-up {
            animation: pop-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
