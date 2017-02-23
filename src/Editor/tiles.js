import {
  TILE_SIZE,
  MAX_SAFE_INTEGER,
  MAGIC_RGB_A_BYTE,
  BATCH_BUFFER_SIZE,
} from "../cfg";

import { roundTo } from "../math";
import { createCanvasBuffer } from "../utils";

import Tile from "./Tile/index";
import Batch from "./Batch/index";
import Texture from "./Texture/index";

/**
 * Push in a new batch operation
 */
export function pushTileBatchOperation() {
  let batch = new Batch();
  this.batches.push(batch);
};

/**
 * @return {Batch}
 */
export function getLatestTileBatchOperation() {
  let offset = this.batches.length - 1;
  return (this.batches[offset]);
};

/**
 * Take the latest tile batch, buffer it (if exceeds bound sizes)
 * and finally push it into the operation stack
 */
export function finalizeBatchOperation() {
  let offset = this.batches.length - 1;
  let batch = this.batches[offset];
  //if (this.batchSizeExceedsBounds) {
  if (true) {
    let buffer = this.createBufferFromBatch(batch);
    batch.buffer = buffer;
    batch.isBuffered = true;
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
  if (!batch.tiles.length) {
    let offset = this.batches.length - 1;
    this.batches.splice(offset, 1);
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function startBatchedDrawing(x, y) {
  this.modes.draw = true;
  let position = this.getRelativeOffset(x, y);
  this.colorTest = this.getRandomRgbaColors();
  this.pushTileBatchOperation();
  this.createBatchTileAt(position.x, position.y, this.colorTest);
  this.clearLatestTileBatch();
};

/**
 * Finally push the recently created batch into the stack
 * @param {Number} x
 * @param {Number} y
 */
export function stopBatchedDrawing(x, y) {
  this.modes.draw = false;
  this.finalizeBatchOperation();
};

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
 * Main method to insert tiles into the active batch
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function createBatchTileAt(x, y, color) {
  // try to overwrite older tiles color
  let otile = this.getTileByPosition(x, y);
  let batch = this.getLatestTileBatchOperation();
  // older tile at same position found, update it
  if (otile !== null) {
    let ocolors = otile.colors[otile.cindex];
    // check if we have to overwrite the old tiles color
    let newOldColorMatches = this.colorArraysMatch(
      color,
      ocolors
    );
    // old and new colors doesnt match, insert new color values
    // into the old tile's color array to save its earlier state
    // as well as push in a new stack operation
    if (!newOldColorMatches) {
      otile.overwritten.unshift(otile.cindex);
      otile.colors.unshift(color);
      batch.tiles.push(otile);
    }
  // no older tile found, lets create one and push it into the batch
  } else {
    let tile = this.createTileAt(x, y);
    tile.colors.unshift(color);
    batch.tiles.push(tile);
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
 * @param {Batch} batch
 * @return {Object}
 */
export function getBatchBoundings(batch) {
  // start position at maximum buffer size
  let x = BATCH_BUFFER_SIZE.MAX_W;
  let y = BATCH_BUFFER_SIZE.MAX_H;
  let px = [];
  let py = [];
  let tiles = batch.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
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
 * @param {Batch} batch
 * @return {Texture}
 */
export function createBufferFromBatch(batch) {
  let tiles = batch.tiles;
  let info = this.getBatchBoundings(batch);
  let buffer = createCanvasBuffer(info.w, info.h);
  buffer.clearRect(0, 0, info.w, info.h);
  let ww = info.w;
  let bx = info.x;
  let by = info.y;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let color = tile.colors[tile.cindex];
    let xx = (tile.x / TILE_SIZE) - bx;
    let yy = (tile.y / TILE_SIZE) - by;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  };
  let texture = new Texture(buffer, bx, by);
  return (texture);
};

/**
 * @param {Batch} batch
 * @return {Boolean}
 */
export function batchSizeExceedsBounds(batch) {
  let size = this.getBatchBoundings(batch); 
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
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
export function offsetExceedsIntegerLimit(x, y) {
  return (
    Math.abs(x) > MAX_SAFE_INTEGER || Math.abs(y) > MAX_SAFE_INTEGER
  );
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

/**
 * Inserts rectangle at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function insertRectangleAt(x, y, width, height, color) {
  x = x * TILE_SIZE;
  y = y * TILE_SIZE;
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      this.createBatchTileAt(x + (xx * TILE_SIZE), y + (yy * TILE_SIZE), color);
    };
  };
  this.finalizeBatchOperation();
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
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      let idx = (xx+(yy*width))*4;
      let a = data[idx+3];
      if (a <= 0) continue; // ignore whitespace
      let r = data[idx+0];
      let g = data[idx+1];
      let b = data[idx+2];
      // 0-255 => 0-1 with precision 1
      a = Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10;
      // create relative batched tile
      let tile = this.createBatchTileAt(
        mx + (xx * TILE_SIZE),
        my + (yy * TILE_SIZE),
        [r,g,b,a]
      );
    };
  };
  this.finalizeBatchOperation();
};
