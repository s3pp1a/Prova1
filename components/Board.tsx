
import React from 'react';
import { CellType, Position, Entity, Ghost, GhostState, Direction } from '../types';
import { MAP_LAYOUT, CELL_SIZE } from '../constants';

interface BoardProps {
  map: number[][];
  pacman: Entity;
  ghosts: Ghost[];
}

const Board: React.FC<BoardProps> = ({ map, pacman, ghosts }) => {
  const renderCell = (cell: number, rowIndex: number, colIndex: number) => {
    switch (cell) {
      case CellType.WALL:
        return <div key={`${rowIndex}-${colIndex}`} className="bg-blue-900 border-[1px] border-blue-700" style={{ width: CELL_SIZE, height: CELL_SIZE }}></div>;
      case CellType.DOT:
        return (
          <div key={`${rowIndex}-${colIndex}`} className="flex items-center justify-center bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
            <div className="w-1.5 h-1.5 bg-pink-200 rounded-full"></div>
          </div>
        );
      case CellType.POWER_PELLET:
        return (
          <div key={`${rowIndex}-${colIndex}`} className="flex items-center justify-center bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
            <div className="w-3 h-3 bg-pink-100 rounded-full dot-pulse shadow-[0_0_5px_white]"></div>
          </div>
        );
      case CellType.GHOST_HOUSE:
        return <div key={`${rowIndex}-${colIndex}`} className="bg-gray-900 border-t-2 border-pink-400" style={{ width: CELL_SIZE, height: CELL_SIZE }}></div>;
      default:
        return <div key={`${rowIndex}-${colIndex}`} className="bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }}></div>;
    }
  };

  const getRotation = (dir: Direction) => {
    switch (dir) {
      case Direction.LEFT: return 'rotate(180deg)';
      case Direction.UP: return 'rotate(-90deg)';
      case Direction.DOWN: return 'rotate(90deg)';
      default: return 'rotate(0deg)';
    }
  };

  return (
    <div className="relative border-4 border-blue-800 rounded shadow-2xl overflow-hidden" 
         style={{ width: map[0].length * CELL_SIZE, height: map.length * CELL_SIZE }}>
      {/* Grid Background */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${map[0].length}, ${CELL_SIZE}px)` }}>
        {map.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
      </div>

      {/* Pac-Man */}
      <div 
        className="absolute transition-all duration-100 ease-linear z-20"
        style={{ 
          left: pacman.pos.x * CELL_SIZE, 
          top: pacman.pos.y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          transform: getRotation(pacman.dir)
        }}
      >
        <div className="w-full h-full bg-yellow-400 rounded-full relative overflow-hidden" 
             style={{ clipPath: 'polygon(100% 0, 100% 30%, 50% 50%, 100% 70%, 100% 100%, 0 100%, 0 0)' }}>
          <div className="absolute top-1 right-2 w-1 h-1 bg-black rounded-full"></div>
        </div>
      </div>

      {/* Ghosts */}
      {ghosts.map((ghost) => (
        <div 
          key={ghost.id}
          className={`absolute transition-all duration-150 ease-linear z-10 ${ghost.state === GhostState.FRIGHTENED ? 'animate-pulse' : ''}`}
          style={{ 
            left: ghost.pos.x * CELL_SIZE, 
            top: ghost.pos.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE
          }}
        >
          <div 
            className="w-full h-full rounded-t-full relative"
            style={{ backgroundColor: ghost.state === GhostState.FRIGHTENED ? '#2121de' : (ghost.state === GhostState.EATEN ? 'transparent' : ghost.color) }}
          >
            {/* Eyes */}
            <div className="absolute top-2 left-1.5 w-4 h-2 flex justify-between px-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                <div className="w-0.5 h-0.5 bg-blue-900 rounded-full"></div>
              </div>
              <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                <div className="w-0.5 h-0.5 bg-blue-900 rounded-full"></div>
              </div>
            </div>
            {/* Ghost Skirt */}
            <div className="absolute bottom-0 w-full h-2 flex">
              <div className="flex-1 bg-inherit h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              <div className="flex-1 bg-inherit h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              <div className="flex-1 bg-inherit h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Board;
