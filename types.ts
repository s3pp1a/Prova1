
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE'
}

export enum CellType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4
}

export enum GhostState {
  CHASE = 'CHASE',
  SCATTER = 'SCATTER',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  pos: Position;
  dir: Direction;
  nextDir: Direction;
  speed: number;
}

export interface Ghost extends Entity {
  id: string;
  color: string;
  state: GhostState;
  homePos: Position;
  targetPos: Position;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  isWin: boolean;
  highScore: number;
  dotsRemaining: number;
  powerModeActive: boolean;
  powerModeTime: number;
}

export interface Commentary {
  text: string;
  type: 'info' | 'warning' | 'success';
}
