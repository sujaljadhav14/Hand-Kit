export interface Point {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type ParticleMode = 'TRAILS' | 'FIREWORKS' | 'HEART' | 'SPHERE';
export type HandGesture = 'NONE' | 'OPEN' | 'FIST' | 'PINCH';

export interface Particle {
  x: number;
  y: number;
  z?: number; // For 3D shapes
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  // Target for shape formation
  targetX?: number;
  targetY?: number;
}

export interface ParticleConfig {
  count: number;
  speed: number;
  decay: number;
  size: number;
  colorCycleSpeed: number;
  gravity: number;
  blendMode: GlobalCompositeOperation;
}

// MediaPipe Types
export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface MultiHandLandmarks extends Array<NormalizedLandmark[]> {}

export interface Results {
  multiHandLandmarks: MultiHandLandmarks;
  multiHandedness?: any;
  image: any;
}

export enum HandLandmark {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  THUMB_IP = 3,
  THUMB_TIP = 4,
  INDEX_FINGER_MCP = 5,
  INDEX_FINGER_PIP = 6,
  INDEX_FINGER_DIP = 7,
  INDEX_FINGER_TIP = 8,
  MIDDLE_FINGER_MCP = 9,
  MIDDLE_FINGER_PIP = 10,
  MIDDLE_FINGER_DIP = 11,
  MIDDLE_FINGER_TIP = 12,
  RING_FINGER_MCP = 13,
  RING_FINGER_PIP = 14,
  RING_FINGER_DIP = 15,
  RING_FINGER_TIP = 16,
  PINKY_MCP = 17,
  PINKY_PIP = 18,
  PINKY_DIP = 19,
  PINKY_TIP = 20
}