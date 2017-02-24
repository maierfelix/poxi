import { TILE_SIZE } from "../cfg";

import { roundTo } from "../math";

import Tile from "./Tile/index";

/**
 * @param {Number} x
 * @param {Number} y
 */
export function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    let position = this.getRelativeOffset(x, y);
    this.createBatchTileAt(position.x, position.y, this.colorTest);
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
  this.createBatchTileAt((x*TILE_SIZE)|0, (y*TILE_SIZE)|0, color);
  this.finalizeBatchOperation();
  return (tile);
};

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
  this.unHoverAllTiles();
  let tile = this.getTileByMouseOffset(x, y);
  if (tile !== null) {
    // set current tile as hovered
    this.hovered.push(tile);
    tile.isHovered = true;
  }
};

/**
 * Set isHovered=false in hovered tiles array
 */
export function unHoverAllTiles() {
  for (let ii = 0; ii < this.hovered.length; ++ii) {
    this.hovered[ii].isHovered = false;
    this.hovered.splice(ii, 1);
  };
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
 * Compare two color arrays if they match both
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 */
export function colorArraysMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
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
    tile.x = x;
    tile.y = y;
  } else {
    throw new Error("Tile position exceeds 32-bit integer limit!");
  }
  return (tile);
};

/**
 * Clear earlier tile at given position
 * => update its color and old color value
 * @param {Number} x
 * @param {Number} y
 * @return {Number}
 */
export function getTileByMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.getTileByPosition(position.x, position.y);
  return (tile);
};

/**
 * Collect all tiles at given relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function getTileByPosition(x, y) {
  // TODO: go backwards? TODO: fix tile overwrite bug
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
 * @return {Object}
 */
export function getTileOffsetAt(x, y) {
  let half = TILE_SIZE / 2;
  let xx = roundTo(x - half, TILE_SIZE);
  let yy = roundTo(y - half, TILE_SIZE);
  return ({
    x: xx,
    y: yy
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
    let batch = batches[ii];
    for (let jj = 0; jj < batch.length; ++jj) {
      if (batch[jj].id === id) return (tile);
    };
  };
  return null;
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
  let x = (tile.x * scale) + this.camera.x;
  let y = (tile.y * scale) + this.camera.y;
  return (
    (x + tilew) >= 0 && x <= width &&
    (y + tileh) >= 0 && y <= height
  );
};
