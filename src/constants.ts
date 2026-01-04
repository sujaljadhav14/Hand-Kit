import { ParticleConfig } from './types';

export const DEFAULT_CONFIG: ParticleConfig = {
  count: 5, // Particles per frame
  speed: 2,
  decay: 0.96,
  size: 3,
  colorCycleSpeed: 2,
  gravity: 0,
  blendMode: 'lighter'
};

export const BLEND_MODES: GlobalCompositeOperation[] = [
  'source-over',
  'lighter',
  'screen',
  'overlay',
  'difference',
  'exclusion'
];

export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_ASPECT_RATIO = VIDEO_WIDTH / VIDEO_HEIGHT;
