import {
  TILE_SIZE,
  BATCH_BUFFER_SIZE
} from "../cfg";

import { roundTo } from "../math";

import Tile from "./Tile/index";

/**
 * @param {Number} x
 * @param {Number} y
 */
export function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    this.pushTileBatch(x, y, false);
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Tile}
 */
export function drawTileAt(x, y, color) {
  let tile = this.createTileAt((x*TILE_SIZE)|0, (y*TILE_SIZE)|0);
  tile.colors.unshift(color);
  this.batches.tiles.push([tile]);
  this.finalizeBatchOperation();
  return (tile);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} state
 */
export function select(x, y, state) {
  this.modes.drag = state;
  this.modes.draw = !!state;
  if (state && this.modes.draw) {
    this.colorTest = this.getRandomRgbaColors();
    this.pushTileBatchOperation();
    this.pushTileBatch(x, y, false);
    this.clearLatestTileBatch();
  } else {
    // finally push the created batch into the cmd stack
    this.finalizeBatchOperation();
  }
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
  this.unHoverAllTiles();
  let tile = this.getTileFromMouseOffset(x, y);
  if (tile !== null) {
    // set current tile as hovered
    this.hovered.push(tile);
    tile.isHovered = true;
  }
};

/**
 * Take the latest tile batch, buffers if necessary
 * and finally pushes it into the operation stack
 */
export function finalizeBatchOperation() {
  let offset = this.batches.tiles.length - 1;
  let batch = this.batches.tiles[offset];
  if (this.batchSizeExceedsLimit(batch)) {
    let buffer = this.createBufferFromBatch(batch);
  }
  this.enqueue({
    batch: batch,
    index: offset
  });
};

/**
 * Clear latest batch operation if empty
 */
export function clearLatestTileBatch() {
  let batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (batch.length <= 0) {
    let offset = this.batches.tiles.length - 1;
    this.batches.tiles.splice(offset, 1);
  }
};

/**
 * @return {Array}
 */
export function getLatestTileBatchOperation() {
  let offset = this.batches.tiles.length - 1;
  let batch = this.batches.tiles;
  return (batch[offset]);
};

/**
 * Push in a new batch operation
 */
export function pushTileBatchOperation() {
  let operation = [];
  this.batches.tiles.push(operation);
};

/**
 * Create, push and batch a new tile at x,y
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} relative
 */
export function pushTileBatch(x, y, relative) {
  let otile = (
    relative ? this.findTileAt(x, y) :
    this.getTileFromMouseOffset(x, y)
  );
  let color = [
    this.colorTest[0],
    this.colorTest[1],
    this.colorTest[2],
    this.colorTest[3]
  ];
  let batch = this.getLatestTileBatchOperation();
  // previous tile found, update it
  if (otile !== null) {
    let ocolors = otile.colors[otile.cindex];
    // check if we have to overwrite the old tiles color
    // e.g => push in a new color state
    let matches = this.colorArraysMatch(
      color,
      ocolors
    );
    // old and new colors doesnt match, insert new color values
    // into the old tile's color array to save its earlier state
    // as well as push in a new stack operation
    if (!matches && ocolors[3] !== 2) {
      otile.colors.unshift(color);
      batch.push(otile);
    }
  // if no tile found, create one and push it into the batch
  } else {
    let tile = (
      relative ? this.createTileAt(x, y) :
      this.createTileAtMouseOffset(x, y)
    );
    tile.colors.unshift(color);
    batch.push(tile);
  }
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
 * Set isHovered=false in hovered tiles array
 */
export function unHoverAllTiles() {
  for (let ii = 0; ii < this.hovered.length; ++ii) {
    this.hovered[ii].isHovered = false;
    this.hovered.splice(ii, 1);
  };
};

/**
 * Calculate cropped size of given batch
 * @param {Array} batch
 * @return {Object}
 */
export function getBatchSize(batch) {
  // min size we have to begin with and reach
  let w = -TILE_SIZE;
  let h = -TILE_SIZE;
  // start position at maximum buffer size
  let x = BATCH_BUFFER_SIZE.MAX_W;
  let y = BATCH_BUFFER_SIZE.MAX_H;
  for (let ii = 0; ii < batch.length; ++ii) {
    let tile = batch[ii];
    let tx = tile.x;
    let ty = tile.y;
    // x, y
    if (tx < x) x = tx;
    if (ty < y) y = ty;
    // w, h
    if (tx > w) w = tx;
    if (ty > h) h = ty;
  };
  // calculate rectangle position
  let xx = x / TILE_SIZE;
  let yy = y / TILE_SIZE;
  // calculate rectangle size
  let ww = (w / TILE_SIZE) - xx;
  let hh = (h / TILE_SIZE) - yy;
  return ({
    x: x / TILE_SIZE,
    y: y / TILE_SIZE,
    // much hax
    w: ww + 1,
    h: hh + 1
  });
};

/**
 * Creates a cropped canvas buffer from a tile batch
 */
export function createBufferFromBatch(batch) {
  let size = this.getBatchSize(batch);
  console.log(size);
};

/**
 * @param {Array} batch
 * @return {Boolean}
 */
export function batchSizeExceedsLimit(batch) {
  let size = this.getBatchSize(batch); 
  return (
    size.w >= BATCH_BUFFER_SIZE.MIN_W &&
    size.h >= BATCH_BUFFER_SIZE.MIN_W
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
  tile.x = x;
  tile.y = y;
  return (tile);
};

/**
 * Clear earlier tile at given position
 * => update its color and old color value
 * @param {Number} x
 * @param {Number} y
 * @return {Number}
 */
export function getTileFromMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.findTileAt(position.x, position.y);
  return (tile);
};

/**
 * Collect all tiles at given relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function findTileAt(x, y) {
  let target = null;
  let batches = this.batches.tiles;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
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
