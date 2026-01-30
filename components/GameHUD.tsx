
import React from 'react';
import { GameState, Commentary } from '../types';

interface GameHUDProps {
  state: GameState;
  commentary: string;
  strategy: string;
}

const GameHUD: React.FC<GameHUDProps> = ({ state, commentary, strategy }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md p-4 bg-gray-900 border-4 border-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.5)]">
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <div className="flex flex-col">
          <span className="text-gray-400">HIGH SCORE</span>
          <span className="text-yellow-400">{state.highScore.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-400">SCORE</span>
          <span className="text-white text-lg">{state.score.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-black p-2 border-2 border-gray-700 rounded">
        <div className="flex gap-1">
          {Array.from({ length: state.lives }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" style={{ clipPath: 'polygon(100% 0, 100% 30%, 50% 50%, 100% 70%, 100% 100%, 0 100%, 0 0)' }}></div>
          ))}
        </div>
        <div className="text-xs text-blue-400">LVL {state.level}</div>
      </div>

      {/* AI Commentary Section */}
      <div className="relative p-3 bg-indigo-950 border-2 border-indigo-500 rounded animate-pulse shadow-[inset_0_0_10px_rgba(99,102,241,0.5)]">
        <div className="absolute -top-3 left-3 px-2 bg-indigo-500 text-[10px] text-white rounded">GEMINI AI SENSEI</div>
        <p className="text-[10px] sm:text-xs leading-relaxed text-indigo-100 italic">
          "{commentary}"
        </p>
      </div>

      {/* Strategy Tip */}
      {strategy && (
        <div className="text-[9px] text-gray-500 uppercase tracking-tighter">
          Pro Tip: {strategy}
        </div>
      )}
    </div>
  );
};

export default GameHUD;
