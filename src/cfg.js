export const TILE_SIZE = 8;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 35;
export const BASE_TILE_COLOR = [0,0,0,0];

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding max throws an out of bounds error
 */
export const BATCH_BUFFER_SIZE = {
  MIN_W: 128,
  MIN_H: 128,
  MAX_W: 1048,
  MAX_H: 1048
};