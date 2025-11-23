
import React from 'react';
import { GameMessage, GameMode, HeroData } from '../types';
import { COLORS, LOOT_BOXES } from '../constants';

interface UIOverlayProps {
  score: { blue: number; red: number };
  messages: GameMessage[];
  onRestart: () => void;
  onHome: () => void;
  gameState: 'playing' | 'menu' | 'gameover';
  winner: 'blue' | 'red' | null;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  
  // Shop props
  coins: number;
  heroes: HeroData[];
  unlockedHeroes: string[];
  selectedHeroId: string;
  onBuyHero: (id: string, price: number) => void;
  onSelectHero: (id: string) => void;
  
  // Box props
  onOpenBox: (boxId: string) => void;
  reward: { type: 'coins' | 'hero', value: number | string, name?: string } | null;
  onCloseReward: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  score, messages, onRestart, onHome, gameState, winner, gameMode, setGameMode,
  coins, heroes, unlockedHeroes, selectedHeroId, onBuyHero, onSelectHero,
  onOpenBox, reward, onCloseReward
}) => {
  
  if (gameState === 'menu') {
    return (
      <div className="absolute inset-0 flex flex-col items-center bg-slate-900 z-50 overflow-y-auto pb-10 hide-scrollbar">
        <div className="mt-8 mb-4 text-center px-4 shrink-0">
           <h1 className="text-5xl md:text-7xl text-white font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600 drop-shadow-lg">
             BRAWL AI
           </h1>
           <div className="mt-2 bg-yellow-400/20 border border-yellow-400/50 px-6 py-2 rounded-full inline-block">
             <span className="text-yellow-400 font-bold text-xl">💰 {coins} Coins</span>
           </div>
        </div>
        
        {/* Mode Selector */}
        <div className="flex gap-2 md:gap-4 mb-6 px-2 w-full justify-center shrink-0">
          <button 
            onClick={() => setGameMode('gem_rush')}
            className={`px-3 py-3 md:px-6 md:py-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 w-24 md:w-32 ${
              gameMode === 'gem_rush' 
                ? 'bg-purple-600 border-purple-300 shadow-[0_0_20px_rgba(147,51,234,0.5)] scale-105' 
                : 'bg-slate-800 border-slate-600 hover:bg-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-xl md:text-2xl">💎</span>
            <span className="text-white font-bold text-[10px] md:text-xs uppercase">Gem Rush</span>
          </button>

          <button 
            onClick={() => setGameMode('deathmatch')}
            className={`px-3 py-3 md:px-6 md:py-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 w-24 md:w-32 ${
              gameMode === 'deathmatch' 
                ? 'bg-red-600 border-red-300 shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-105' 
                : 'bg-slate-800 border-slate-600 hover:bg-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-xl md:text-2xl">💀</span>
            <span className="text-white font-bold text-[10px] md:text-xs uppercase">Deathmatch</span>
          </button>

          <button 
            onClick={() => setGameMode('boss_hunt')}
            className={`px-3 py-3 md:px-6 md:py-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 w-24 md:w-32 ${
              gameMode === 'boss_hunt' 
                ? 'bg-amber-600 border-amber-300 shadow-[0_0_20px_rgba(217,119,6,0.5)] scale-105' 
                : 'bg-slate-800 border-slate-600 hover:bg-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-xl md:text-2xl">👹</span>
            <span className="text-white font-bold text-[10px] md:text-xs uppercase">Boss Hunt</span>
          </button>
        </div>
        
        <button 
          onClick={onRestart}
          className="px-16 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-display text-3xl rounded-full shadow-[0_0_30px_rgba(250,204,21,0.5)] transform transition hover:scale-105 active:scale-95 mb-8 shrink-0"
        >
          PLAY
        </button>

        {/* Brawler Shop / Selector */}
        <div className="w-full max-w-4xl px-4 mb-8 shrink-0">
          <h3 className="text-white font-display text-2xl mb-4 text-center">BRAWLERS</h3>
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x px-4 justify-start md:justify-center hide-scrollbar">
            {heroes.map(hero => {
              const isUnlocked = unlockedHeroes.includes(hero.id);
              const isSelected = selectedHeroId === hero.id;
              
              return (
                <div 
                  key={hero.id}
                  className={`relative flex-shrink-0 w-64 bg-slate-800 rounded-2xl border-4 p-4 flex flex-col items-center gap-3 transition-all duration-200 snap-center ${
                    isSelected ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] -translate-y-2' : 
                    isUnlocked ? 'border-slate-600 hover:border-white/50' : 'border-slate-700 opacity-80 grayscale'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">SELECTED</div>
                  )}
                  
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-2 shadow-inner"
                    style={{ backgroundColor: hero.color }}
                  >
                    {hero.icon}
                  </div>
                  
                  <h4 className="text-white font-display text-2xl">{hero.name}</h4>
                  
                  {/* Stats Bars */}
                  <div className="w-full space-y-1">
                     <div className="flex items-center text-xs text-gray-400 gap-2">
                        <span>HP</span>
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(hero.hp / 7000) * 100}%` }}></div>
                        </div>
                     </div>
                     <div className="flex items-center text-xs text-gray-400 gap-2">
                        <span>DMG</span>
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${(hero.damage / 1000) * 100}%` }}></div>
                        </div>
                     </div>
                     <div className="flex items-center text-xs text-gray-400 gap-2">
                        <span>SPD</span>
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(hero.speed / 8) * 100}%` }}></div>
                        </div>
                     </div>
                  </div>

                  {isUnlocked ? (
                    <button 
                      onClick={() => onSelectHero(hero.id)}
                      disabled={isSelected}
                      className={`w-full py-2 rounded-lg font-bold text-sm transition ${
                        isSelected ? 'bg-slate-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isSelected ? 'EQUIPPED' : 'SELECT'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => onBuyHero(hero.id, hero.price)}
                      className={`w-full py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                         coins >= hero.price ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span>🔒 Unlock</span>
                      <span>{hero.price} 💰</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loot Boxes */}
        <div className="w-full max-w-4xl px-4 mb-20 shrink-0">
          <h3 className="text-white font-display text-2xl mb-4 text-center">SHOP</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {LOOT_BOXES.map(box => (
              <button 
                key={box.id}
                onClick={() => onOpenBox(box.id)}
                className="relative w-32 h-40 bg-slate-800 rounded-xl border-4 border-b-8 flex flex-col items-center justify-between py-3 transition-transform hover:scale-105 active:scale-95"
                style={{ borderColor: box.color }}
              >
                 <div className="text-4xl animate-pulse">{box.icon}</div>
                 <div className="text-white font-display text-sm">{box.name}</div>
                 <div className="bg-black/40 px-3 py-1 rounded-full text-yellow-400 font-bold text-sm flex items-center gap-1">
                    {box.price} 💰
                 </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reward Modal */}
        {reward && (
           <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center animate-fade-in" onClick={onCloseReward}>
              <div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] flex flex-col items-center gap-6 max-w-sm mx-4 animate-pop-up text-center" onClick={e => e.stopPropagation()}>
                 <h2 className="text-4xl font-display text-white">NEW ITEM!</h2>
                 
                 <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-6xl shadow-inner animate-bounce">
                    {reward.type === 'coins' ? '💰' : 
                     heroes.find(h => h.id === reward.value)?.icon || '🎁'}
                 </div>
                 
                 <div className="text-2xl text-white font-bold">
                    {reward.type === 'coins' ? (
                       <span>+{reward.value} Coins</span>
                    ) : (
                       <span className="text-yellow-400">{reward.name} Unlocked!</span>
                    )}
                 </div>
                 
                 <button 
                   onClick={onCloseReward}
                   className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xl"
                 >
                   COLLECT
                 </button>
              </div>
           </div>
        )}

      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Scoreboard */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <div className="bg-blue-600/90 text-white px-6 py-3 rounded-l-full border-r-2 border-black/20 font-display text-4xl shadow-lg min-w-[110px] text-center">
          {score.blue}
        </div>
        <div className="bg-slate-800/90 p-3 rounded-full border-2 border-white/20 shadow-xl z-20">
           {gameMode === 'gem_rush' ? <span className="text-3xl">💎</span> : <span className="text-3xl">💀</span>}
        </div>
        <div className="bg-red-600/90 text-white px-6 py-3 rounded-r-full border-l-2 border-black/20 font-display text-4xl shadow-lg min-w-[110px] text-center">
          {score.red}
        </div>
      </div>

      {/* Announcer Toast */}
      <div className="absolute top-24 left-0 w-full flex flex-col items-center gap-2 pointer-events-none">
        {messages.slice(-1).map(msg => (
          <div key={msg.id} className="animate-bounce-in">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3 rounded-full font-display text-2xl uppercase shadow-[0_0_15px_rgba(249,115,22,0.8)] border-4 border-white rotate-[-2deg] text-center">
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto animate-fade-in p-4 text-center">
          <h1 className={`text-7xl md:text-8xl font-display mb-4 drop-shadow-lg ${winner === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>
            {winner === 'blue' ? 'VICTORY!' : 'DEFEAT!'}
          </h1>
          
          <div className="flex items-center gap-2 mb-8 bg-slate-800 px-6 py-3 rounded-full border border-slate-600">
             <span className="text-yellow-400 text-2xl">💰</span>
             <span className="text-white font-bold text-2xl">+{winner === 'blue' ? 60 : 10} Coins</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <button 
              onClick={onHome}
              className="px-8 py-3 bg-slate-700 text-white font-display text-xl rounded-full hover:bg-slate-600 transition shadow-lg border-2 border-slate-500 hover:scale-105 active:scale-95"
            >
              SHOP / HOME
            </button>
            <button 
              onClick={onRestart}
              className="px-10 py-3 bg-yellow-400 text-slate-900 font-display text-xl rounded-full hover:bg-yellow-300 transition shadow-xl hover:scale-105 active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
