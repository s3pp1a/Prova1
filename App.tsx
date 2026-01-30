
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Direction, 
  CellType, 
  GhostState, 
  Position, 
  Entity, 
  Ghost, 
  GameState 
} from './types';
import { 
  MAP_LAYOUT, 
  INITIAL_PACMAN_POS, 
  GHOST_SPAWN_POS, 
  DIRECTIONS_VECTORS, 
  GHOST_COLORS,
  TICK_RATE
} from './constants';
import Board from './components/Board';
import GameHUD from './components/GameHUD';
import { getGeminiCommentary, getGeminiStrategy, GameStatus } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    level: 1,
    isGameOver: false,
    isPaused: true,
    isWin: false,
    highScore: 10000,
    dotsRemaining: 0,
    powerModeActive: false,
    powerModeTime: 0,
  });

  const [map, setMap] = useState<number[][]>(() => MAP_LAYOUT.map(row => [...row]));
  const [pacman, setPacman] = useState<Entity>({
    pos: INITIAL_PACMAN_POS,
    dir: Direction.NONE,
    nextDir: Direction.NONE,
    speed: 0.15,
  });

  const [ghosts, setGhosts] = useState<Ghost[]>([
    { id: 'blinky', pos: GHOST_SPAWN_POS, dir: Direction.LEFT, nextDir: Direction.LEFT, speed: 0.1, color: GHOST_COLORS.BLINKY, state: GhostState.SCATTER, homePos: { x: 17, y: 1 }, targetPos: { x: 17, y: 1 } },
    { id: 'pinky', pos: GHOST_SPAWN_POS, dir: Direction.RIGHT, nextDir: Direction.RIGHT, speed: 0.1, color: GHOST_COLORS.PINKY, state: GhostState.SCATTER, homePos: { x: 1, y: 1 }, targetPos: { x: 1, y: 1 } },
    { id: 'inky', pos: GHOST_SPAWN_POS, dir: Direction.UP, nextDir: Direction.UP, speed: 0.1, color: GHOST_COLORS.INKY, state: GhostState.SCATTER, homePos: { x: 17, y: 18 }, targetPos: { x: 17, y: 18 } },
    { id: 'clyde', pos: GHOST_SPAWN_POS, dir: Direction.DOWN, nextDir: Direction.DOWN, speed: 0.1, color: GHOST_COLORS.CLYDE, state: GhostState.SCATTER, homePos: { x: 1, y: 18 }, targetPos: { x: 1, y: 18 } },
  ]);

  const [commentary, setCommentary] = useState("PRESS START TO PLAY!");
  const [strategy, setStrategy] = useState("Eat the dots, avoid the ghosts!");

  // Refs for logic loop to avoid stale closures
  const stateRef = useRef(gameState);
  const pacmanRef = useRef(pacman);
  const ghostsRef = useRef(ghosts);
  const mapRef = useRef(map);
  // Fix: Provide initial value for useRef to satisfy environment constraints requiring exactly 1 argument.
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    pacmanRef.current = pacman;
  }, [pacman]);

  useEffect(() => {
    ghostsRef.current = ghosts;
  }, [ghosts]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  // AI Interaction
  const triggerAIUpdate = useCallback(async (status: GameStatus) => {
    const text = await getGeminiCommentary(status);
    setCommentary(text);
    if (status.event === 'START' || status.event === 'WIN') {
      const tip = await getGeminiStrategy(stateRef.current.score, stateRef.current.level);
      setStrategy(tip);
    }
  }, []);

  // Initialization
  useEffect(() => {
    const dots = map.flat().filter(c => c === CellType.DOT || c === CellType.POWER_PELLET).length;
    setGameState(prev => ({ ...prev, dotsRemaining: dots }));
    triggerAIUpdate({ event: 'START', score: 0, lives: 3 });
  }, []);

  // Movement Helpers
  const canMove = (pos: Position, dir: Direction): boolean => {
    const vec = DIRECTIONS_VECTORS[dir];
    const newX = Math.round(pos.x + vec.x);
    const newY = Math.round(pos.y + vec.y);
    
    // Bounds check
    if (newX < 0 || newX >= mapRef.current[0].length || newY < 0 || newY >= mapRef.current.length) return false;
    
    const cell = mapRef.current[newY][newX];
    return cell !== CellType.WALL;
  };

  const getDistance = (p1: Position, p2: Position) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // Game Loop
  const gameTick = useCallback(() => {
    if (stateRef.current.isPaused || stateRef.current.isGameOver) return;

    // --- Update Pac-Man ---
    let newPacman = { ...pacmanRef.current };
    
    // Try to change direction if queued
    if (newPacman.nextDir !== Direction.NONE && canMove(newPacman.pos, newPacman.nextDir)) {
      newPacman.dir = newPacman.nextDir;
      newPacman.nextDir = Direction.NONE;
    }

    // Move
    if (canMove(newPacman.pos, newPacman.dir)) {
      const vec = DIRECTIONS_VECTORS[newPacman.dir];
      newPacman.pos = {
        x: Math.round((newPacman.pos.x + vec.x * newPacman.speed) * 100) / 100,
        y: Math.round((newPacman.pos.y + vec.y * newPacman.speed) * 100) / 100
      };
    }

    // Portal logic
    if (newPacman.pos.x < 0) newPacman.pos.x = mapRef.current[0].length - 1;
    if (newPacman.pos.x >= mapRef.current[0].length) newPacman.pos.x = 0;

    // --- Interaction Logic ---
    const gridX = Math.round(newPacman.pos.x);
    const gridY = Math.round(newPacman.pos.y);
    const cell = mapRef.current[gridY]?.[gridX];

    if (cell === CellType.DOT || cell === CellType.POWER_PELLET) {
      const newMap = [...mapRef.current];
      newMap[gridY][gridX] = CellType.EMPTY;
      setMap(newMap);
      
      const isPellet = cell === CellType.POWER_PELLET;
      const points = isPellet ? 50 : 10;
      
      setGameState(prev => {
        const dotsLeft = prev.dotsRemaining - 1;
        const newScore = prev.score + points;
        if (dotsLeft === 0) {
          triggerAIUpdate({ event: 'WIN', score: newScore, lives: prev.lives });
          return { ...prev, score: newScore, dotsRemaining: 0, isWin: true, isPaused: true };
        }
        
        if (isPellet) {
          triggerAIUpdate({ event: 'POWER_UP', score: newScore, lives: prev.lives });
          return { ...prev, score: newScore, dotsRemaining: dotsLeft, powerModeActive: true, powerModeTime: 600 };
        }
        
        return { ...prev, score: newScore, dotsRemaining: dotsLeft };
      });
    }

    // --- Update Ghosts ---
    const newGhosts = ghostsRef.current.map(ghost => {
      let g = { ...ghost };
      
      // Update target based on state
      if (stateRef.current.powerModeActive) {
        g.state = GhostState.FRIGHTENED;
      } else {
        g.state = GhostState.CHASE;
      }

      const target = g.state === GhostState.FRIGHTENED ? g.homePos : pacmanRef.current.pos;
      
      // Movement logic
      if (canMove(g.pos, g.dir)) {
        const vec = DIRECTIONS_VECTORS[g.dir];
        g.pos = {
          x: Math.round((g.pos.x + vec.x * g.speed) * 100) / 100,
          y: Math.round((g.pos.y + vec.y * g.speed) * 100) / 100
        };
      } else {
        // Change direction when hitting wall
        const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        let bestDir = Direction.NONE;
        let minDist = Infinity;
        
        dirs.forEach(d => {
          // Can't reverse immediately
          if (DIRECTIONS_VECTORS[d].x === -DIRECTIONS_VECTORS[g.dir].x && 
              DIRECTIONS_VECTORS[d].y === -DIRECTIONS_VECTORS[g.dir].y) return;
          
          if (canMove(g.pos, d)) {
            const nextPos = { 
              x: g.pos.x + DIRECTIONS_VECTORS[d].x, 
              y: g.pos.y + DIRECTIONS_VECTORS[d].y 
            };
            const dist = getDistance(nextPos, target);
            if (dist < minDist) {
              minDist = dist;
              bestDir = d;
            }
          }
        });
        g.dir = bestDir;
      }

      // Check collision
      const dist = getDistance(newPacman.pos, g.pos);
      if (dist < 0.6) {
        if (g.state === GhostState.FRIGHTENED) {
          // Eat ghost
          g.pos = GHOST_SPAWN_POS;
          g.state = GhostState.CHASE;
          setGameState(prev => ({ ...prev, score: prev.score + 200 }));
          triggerAIUpdate({ event: 'GHOST_EATEN', score: stateRef.current.score + 200, lives: stateRef.current.lives });
        } else {
          // Pac-man dies
          setGameState(prev => {
            const newLives = prev.lives - 1;
            if (newLives <= 0) {
              triggerAIUpdate({ event: 'DIED', score: prev.score, lives: 0 });
              return { ...prev, lives: 0, isGameOver: true, isPaused: true };
            }
            // Reset positions
            newPacman.pos = INITIAL_PACMAN_POS;
            newPacman.dir = Direction.NONE;
            triggerAIUpdate({ event: 'DIED', score: prev.score, lives: newLives });
            return { ...prev, lives: newLives, isPaused: true };
          });
          // Reset all ghosts
          newGhosts.forEach(gh => { gh.pos = GHOST_SPAWN_POS; gh.dir = Direction.LEFT; });
        }
      }

      return g;
    });

    setPacman(newPacman);
    setGhosts(newGhosts);

    if (stateRef.current.powerModeActive) {
      setGameState(prev => ({
        ...prev,
        powerModeTime: prev.powerModeTime - 1,
        powerModeActive: prev.powerModeTime > 0
      }));
    }

    requestRef.current = requestAnimationFrame(gameTick);
  }, [triggerAIUpdate]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameTick]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver || stateRef.current.isWin) return;
      
      let next = Direction.NONE;
      switch (e.key) {
        case 'ArrowUp': case 'w': next = Direction.UP; break;
        case 'ArrowDown': case 's': next = Direction.DOWN; break;
        case 'ArrowLeft': case 'a': next = Direction.LEFT; break;
        case 'ArrowRight': case 'd': next = Direction.RIGHT; break;
        case 'Enter': 
          setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
          return;
      }
      
      if (next !== Direction.NONE) {
        setPacman(prev => ({ ...prev, nextDir: next }));
        if (stateRef.current.isPaused) setGameState(prev => ({ ...prev, isPaused: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      level: 1,
      isGameOver: false,
      isPaused: true,
      isWin: false,
      highScore: Math.max(stateRef.current.highScore, stateRef.current.score),
      dotsRemaining: map.flat().filter(c => c === CellType.DOT || c === CellType.POWER_PELLET).length,
      powerModeActive: false,
      powerModeTime: 0,
    });
    setMap(MAP_LAYOUT.map(row => [...row]));
    setPacman({ pos: INITIAL_PACMAN_POS, dir: Direction.NONE, nextDir: Direction.NONE, speed: 0.15 });
    setGhosts([
      { id: 'blinky', pos: GHOST_SPAWN_POS, dir: Direction.LEFT, nextDir: Direction.LEFT, speed: 0.1, color: GHOST_COLORS.BLINKY, state: GhostState.SCATTER, homePos: { x: 17, y: 1 }, targetPos: { x: 17, y: 1 } },
      { id: 'pinky', pos: GHOST_SPAWN_POS, dir: Direction.RIGHT, nextDir: Direction.RIGHT, speed: 0.1, color: GHOST_COLORS.PINKY, state: GhostState.SCATTER, homePos: { x: 1, y: 1 }, targetPos: { x: 1, y: 1 } },
      { id: 'inky', pos: GHOST_SPAWN_POS, dir: Direction.UP, nextDir: Direction.UP, speed: 0.1, color: GHOST_COLORS.INKY, state: GhostState.SCATTER, homePos: { x: 17, y: 18 }, targetPos: { x: 17, y: 18 } },
      { id: 'clyde', pos: GHOST_SPAWN_POS, dir: Direction.DOWN, nextDir: Direction.DOWN, speed: 0.1, color: GHOST_COLORS.CLYDE, state: GhostState.SCATTER, homePos: { x: 1, y: 18 }, targetPos: { x: 1, y: 18 } },
    ]);
    triggerAIUpdate({ event: 'START', score: 0, lives: 3 });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 gap-6 select-none overflow-hidden">
      <h1 className="text-2xl sm:text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-blue-500 to-yellow-400 animate-pulse uppercase">
        GEMINI-MAN
      </h1>

      <GameHUD state={gameState} commentary={commentary} strategy={strategy} />

      <div className="relative group">
        <Board map={map} pacman={pacman} ghosts={ghosts} />
        
        {/* Overlays */}
        {(gameState.isPaused && !gameState.isGameOver && !gameState.isWin) && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-yellow-400 text-2xl mb-4">READY?</p>
              <p className="text-white text-[10px] animate-bounce">PRESS ARROWS TO START</p>
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-50">
            <div className="text-center p-6 border-4 border-red-500 rounded-lg">
              <h2 className="text-3xl text-white mb-2">GAME OVER</h2>
              <p className="text-white text-sm mb-6">FINAL SCORE: {gameState.score}</p>
              <button 
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded text-xs transition-colors"
              >
                INSERT COIN (RESTART)
              </button>
            </div>
          </div>
        )}

        {gameState.isWin && (
          <div className="absolute inset-0 bg-blue-900/80 flex items-center justify-center z-50">
            <div className="text-center p-6 border-4 border-blue-400 rounded-lg">
              <h2 className="text-3xl text-yellow-400 mb-2">YOU WIN!</h2>
              <p className="text-white text-sm mb-6">ALL DOTS CONSUMED</p>
              <button 
                onClick={resetGame}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded text-xs font-bold transition-colors"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-[10px] text-gray-500 text-center">
        <div className="flex gap-4">
          <p>USE ARROWS OR WASD TO MOVE</p>
          <p>ENTER TO PAUSE</p>
        </div>
        <p className="mt-2 text-blue-900 opacity-50">POWERED BY GEMINI 3 FLASH</p>
      </div>
    </div>
  );
};

export default App;
