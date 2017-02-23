import {
  TILE_SIZE,
  MAGIC_RGB_A_BYTE,
  BATCH_BUFFER_SIZE,
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
 * Take the latest tile batch, buffers if necessary
 * and finally pushes it into the operation stack
 */
export function finalizeBatchOperation() {
  let offset = this.batches.tiles.length - 1;
  let batch = this.batches.tiles[offset];
  if (true) {
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
    relative ? this.getTileByPosition(x, y) :
    this.getTileByMouseOffset(x, y)
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
      otile.overwrite.unshift({
        cindex: otile.cindex + 1, // shift by 1, since we unshifted before
        tile: otile
      });
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
 * Calculate cropped size of given batch
 * @param {Array} batch
 * @return {Object}
 */
export function getBatchSize(batch) {
  // start position at maximum buffer size
  let x = BATCH_BUFFER_SIZE.MAX_W;
  let y = BATCH_BUFFER_SIZE.MAX_H;
  let px = [];
  let py = [];
  for (let ii = 0; ii < batch.length; ++ii) {
    let tile = batch[ii];
    px.push(tile.x);
    py.push(tile.y);
  };
  px.sort((a, b) => { return a - b; });
  py.sort((a, b) => { return a - b; });
  let idx = px.length-1;
  // calculate rectangle position
  let xx = (px[0] / TILE_SIZE) | 0;
  let yy = (py[0] / TILE_SIZE) | 0;
  // calculate rectangle size
  let ww = (((px[idx] - px[0]) / TILE_SIZE) | 0) + 1;
  let hh = (((py[idx] - py[0]) / TILE_SIZE) | 0) + 1;
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
};

/**
 * Creates a cropped canvas buffer from a tile batch
 */
export function createBufferFromBatch(batch) {
  let info = this.getBatchSize(batch);
  let obj = {
    x: info.x,
    y: info.y,
    width: info.w,
    height: info.h,
    buffer: null
  };
  let buffer = this.instance.createCanvasBuffer(info.w, info.h);
  let ww = info.w;
  for (let ii = 0; ii < batch.length; ++ii) {
    let tile = batch[ii];
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    let xx = ii % ww;
    let yy = Math.floor(ii / ww);
    buffer.fillStyle = `rgba(${r},${g},${b},${a})`;
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  };
  this.instance.rofl = buffer.canvas;
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
 * Get tile by it's id
 * @param {Number} id
 * @return {Tile}
 */
export function getTileById(id) {
  let batches = this.batches.tiles;
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

/**
 * Transforms passed canvas ctx into a single batch operation
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
export function insertSpriteContextAt(ctx, x, y) {
  let canvas = ctx.canvas;
  let width = canvas.width;
  let height = canvas.height;
  let xx = 0;
  let yy = 0;
  // start ctx insertion from given position
  let data = ctx.getImageData(0, 0, width, height).data;
  let position = this.getRelativeOffset(x, y);
  let mx = position.x;
  let my = position.y;
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  let tiles = [];
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      let idx = (xx+(yy*width))*4;
      let a = data[idx+3];
      if (a <= 0) continue; // ignore whitespace
      let r = data[idx+0];
      let g = data[idx+1];
      let b = data[idx+2];
      // create relative batched tile
      let tile = this.createTileAt(
        mx + (xx * TILE_SIZE),
        my + (yy * TILE_SIZE)
      );
      // 0-255 => 0-1 with precision 1
      a = Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10;
      tile.colors.unshift([r,g,b,a]);
      batch.push(tile);
    };
  };
  this.clearLatestTileBatch();
  if (batch.length) this.finalizeBatchOperation();
};
