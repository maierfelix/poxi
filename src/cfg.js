import { hashFromString } from "./utils";

export const TILE_SIZE = 8;
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 32;
export const MAGIC_SCALE = .125;
// trace ghost tiles by alpha=^2
export const UNSET_TILE_COLOR = 2;
export const BASE_TILE_COLOR = [0,0,0,0];

// 32-bit ints are allowed at maximum
export const MAX_SAFE_INTEGER = (2 ** 31) - 1;

// alpha byte to rgb-alpha conversion
export const MAGIC_RGB_A_BYTE = 0.00392;

// factor when to hide the grid
export const HIDE_GRID = 0.0;
export const GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
export const ZOOM_SPEED = 15;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */
export const BATCH_BUFFER_SIZE = {
  MIN_W: 8,
  MIN_H: 8,
  MIN_L: 32
};

export const DRAW_HASH = hashFromString("draw");