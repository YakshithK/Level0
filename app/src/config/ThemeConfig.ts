import { ThemeConfig } from '../types/gameSchema';

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  lava: {
    backgroundColor: '#2d1b1b',
    playerColor: 0xff6b35,
    platformColors: [0xff4500, 0xff6347, 0xff4500],
    enemyColors: [0xff0000, 0x8b0000],
    effects: ['fire', 'smoke', 'lava_bubbles']
  },
  ice: {
    backgroundColor: '#1b2d2d',
    playerColor: 0x87ceeb,
    platformColors: [0x87ceeb, 0xb0e0e6, 0xadd8e6],
    enemyColors: [0x00ffff, 0x008b8b],
    effects: ['snow', 'ice_crystals', 'frozen']
  },
  forest: {
    backgroundColor: '#1b2d1b',
    playerColor: 0x228b22,
    platformColors: [0x228b22, 0x32cd32, 0x006400],
    enemyColors: [0x8b4513, 0x654321],
    effects: ['leaves', 'grass', 'nature']
  },
  space: {
    backgroundColor: '#0a0a2a',
    playerColor: 0x4169e1,
    platformColors: [0x4169e1, 0x1e90ff, 0x0000cd],
    enemyColors: [0xff1493, 0x9400d3],
    effects: ['stars', 'nebula', 'cosmic']
  },
  desert: {
    backgroundColor: '#2d2d1b',
    playerColor: 0xffd700,
    platformColors: [0xdaa520, 0xf4a460, 0xcd853f],
    enemyColors: [0x8b4513, 0xa0522d],
    effects: ['sand', 'heat_waves', 'cactus']
  },
  underwater: {
    backgroundColor: '#1b1b2d',
    playerColor: 0x00bfff,
    platformColors: [0x20b2aa, 0x48d1cc, 0x40e0d0],
    enemyColors: [0xff69b4, 0xff1493],
    effects: ['bubbles', 'seaweed', 'water_ripples']
  }
};