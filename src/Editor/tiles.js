import {
  TILE_SIZE,
  BASE_TILE_COLOR,
  UNSET_TILE_COLOR
} from "../cfg";

import { roundTo } from "../math";

import Tile from "./Tile/index";

/**
 * Set ctrl+a mode=true
 */
export function selectAll() {
  this.modes.selectAll = true;
};

/**
 * Hover & unhover tiles
 * @param {Number} x
 * @param {Number} y
 */
export function hover(x, y) {
  this.mx = x;
  this.my = y;
};

/**
 * Erase a tile by mouse offset
 * @param {Number} x
 * @param {Number} y
 */
export function eraseTileAtMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  this.eraseTileAt(position.x, position.y);
};

/**
 * Erase a tile at given relative position
 * @param {Number} x
 * @param {Number} y
 */
export function eraseTileAt(x, y) {
  let tile = this.getStackRelativeTileAt(x, y);
  this.pushTileBatchOperation();
  if (tile !== null) {
    let color = tile.colors.shift();
    this.createBatchTileAt(tile.x, tile.y, [0,0,0,0]);
  }
  this.finalizeBatchOperation();
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    let position = this.getRelativeOffset(x, y);
    this.createBatchTileAt(position.x, position.y, this._fillStyle);
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Tile}
 */
export function drawTileAt(x, y, color) {
  this.pushTileBatchOperation();
  this.createBatchTileAt(x|0, y|0, color);
  this.finalizeBatchOperation();
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getRelativeOffset(x, y) {
  let rpos = this.camera.getRelativeOffset(x, y);
  let tpos = this.getTileOffsetAt(rpos.x, rpos.y);
  return (tpos);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function createTileAtMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.createTileAt(position.x, position.y);
  return (tile);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function createTileAt(x, y) {
  let tile = new Tile();
  if (!this.offsetExceedsIntegerLimit(x, y)) {
    tile.x = x | 0;
    tile.y = y | 0;
  } else {
    throw new Error("Tile position exceeds 32-bit integer limit!");
  }
  return (tile);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function getTileByMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.getTileAt(position.x, position.y);
  return (tile);
};

/**
 * Gets non-relative (stack independant) tile by given position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function getTileAt(x, y) {
  let target = null;
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii].tiles;
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        target = tile;
      }
    };
  };
  return (target);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function getStackRelativeTileByMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.getStackRelativeTileAt(position.x, position.y);
  return (tile);
};

/**
 * Gets stack relative (absolute) tile by given position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function getStackRelativeTileAt(x, y) {
  let target = null;
  let sIndex = this.sindex;
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii].tiles;
    if (sIndex - ii < 0) continue;
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        target = tile;
      }
    };
  };
  return (target);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getTileOffsetAt(x, y) {
  let half = TILE_SIZE / 2;
  let xx = roundTo(x - half, TILE_SIZE);
  let yy = roundTo(y - half, TILE_SIZE);
  return ({
    x: xx / TILE_SIZE,
    y: yy / TILE_SIZE
  });
};

/**
 * Get tile by it's id
 * @param {Number} id
 * @return {Tile}
 */
export function getTileById(id) {
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let tiles = batches[ii].tiles;
    for (let jj = 0; jj < tiles.length; ++jj) {
      let tile = tiles[jj];
      if (tile.id === id) return (tile);
    };
  };
  return (null);
};

/**
 * Returns rnd(0-255) rgba color array with a=1
 * @return {Array}
 */
export function getRandomRgbaColors() {
  let cmax = 256;
  let r = (Math.random() * cmax) | 0;
  let g = (Math.random() * cmax) | 0;
  let b = (Math.random() * cmax) | 0;
  return ([r, g, b, 1]);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getTileColorAt(x, y) {
  let target = null;
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    // buffer color
    let color = batch.getTileColorAt(x, y);
    if (color !== null) target = color;
  };
  return (target);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getStackRelativeTileColorAt(x, y) {
  let target = null;
  let sIndex = this.sindex;
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    if (sIndex - ii < 0) continue;
    let color = batch.getTileColorAt(x, y);
    if (color !== null) target = color;
  };
  return (target);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getStackRelativeTileColorByMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  return (this.getStackRelativeTileColorAt(position.x, position.y));
};

/**
 * Checks if given tile is inside camera view
 * @param {Tile} tile
 * @return {Boolean}
 */
export function isTileInsideView(tile) {
  let scale = this.camera.s;
  let width = this.camera.width;
  let height = this.camera.height;
  let tilew = TILE_SIZE * scale;
  let tileh = TILE_SIZE * scale;
  let x = ((tile.x * TILE_SIZE) * scale) + this.camera.x;
  let y = ((tile.y * TILE_SIZE) * scale) + this.camera.y;
  return (
    (x + tilew) >= 0 && (x - tilew) <= width &&
    (y + tileh) >= 0 && (y - tileh) <= height
  );
};
