import {
  UNSET_TILE_COLOR,
  BATCH_BUFFER_SIZE
} from "../cfg";

import {
  colorsMatch,
  sortAscending,
  createCanvasBuffer
} from "../utils";

import {
  intersectRectangles
} from "../math";

import Tile from "./Tile/index";
import Batch from "./Batch/index";

/**
 * Push in a new batch operation
 */
export function pushTileBatchOperation() {
  let batch = new Batch();
  this.batches.push(batch);
};

/**
 * Refreshes all batch indexes
 */
export function refreshBatches() {
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    batch.index = ii;
  };
};

/**
 * Take the latest tile batch, buffer it (if exceeds bound sizes)
 * and finally push it into the operation stack
 * @return {Void}
 */
export function finalizeBatchOperation() {
  let offset = this.batches.length - 1;
  let batch = this.batches[offset];
  if (batch.exceedsBounds() && !batch.isRawBuffer) {
    batch.renderBuffer();
  } else {
    // dont push batch into stack if batch is empty
    if (batch.isEmpty() && !batch.isBackground) {
      this.batches.splice(offset, 1);
      this.refreshBatches();
      return;
    }
    // got a background fill batch, check if we have to push it into the stack
    if (batch.isBackground) {
      let last = this.batches[this.batches.length - 2];
      // last operation was a background fill too, check if their colors match
      if (last && last.isBackground) {
        if (colorsMatch(batch.bgcolor, last.bgcolor)) return;
      }
    }
  }
  this.enqueue({
    batch: batch
  });
  this.updateGlobalBoundings();
  this.refreshBatches();
  return;
};

/**
 * @return {Batch}
 */
export function getLatestTileBatchOperation() {
  let offset = this.batches.length - 1;
  return (this.batches[offset]);
};

/**
 * Clear latest batch operation if empty
 * @return {Void}
 */
export function clearLatestTileBatch() {
  if (!this.batches.length) return;
  let batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (!batch.tiles.length) {
    let offset = this.batches.length - 1;
    this.batches.splice(offset, 1);
  }
  return;
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function startBatchedDrawing(x, y) {
  this.modes.draw = true;
  let position = this.getRelativeOffset(x, y);
  this.pushTileBatchOperation();
  this.createBatchTileAt(position.x, position.y, this._fillStyle);
};

/**
 * Finally push the recently created batch into the stack
 * @param {Number} x
 * @param {Number} y
 */
export function stopBatchedDrawing(x, y) {
  this.modes.draw = false;
  this.finalizeBatchOperation();
  this.clearLatestTileBatch();
};

/**
 * Main method to insert tiles into the active batch
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Void}
 */
export function createBatchTileAt(x, y, color) {
  // try to overwrite older tiles color
  let otile = this.getTileAt(x, y);
  let batch = this.getLatestTileBatchOperation();
  // only push tile if necessary
  if (otile !== null) {
    if (
      otile.colorMatchesWithTile(color) ||
      otile.colors[otile.cindex][3] === UNSET_TILE_COLOR
    ) return;
  }
  let tile = this.createTileAt(x, y);
  tile.colors.unshift(color);
  batch.addTile(tile);
  return;
};

/**
 * Get batch by the given tile
 * @param {Tile} tile
 * @return {Batch}
 */
export function getBatchByTile(tile) {
  let id = tile.id;
  let batches = this.batches;
  let x = tile.x;
  let y = tile.y;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    let tiles = batch.tiles;
    for (let jj = 0; jj < tiles.length; ++jj) {
      let tile = tiles[jj];
      if (tile.id === id) return (batch);
    };
  };
  return null;
};

/**
 * Get batch by the given tile
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
export function getStackRelativeBatchByPoint(x, y) {
  let batches = this.batches;
  let sindex = this.sindex;
  for (let ii = 0; ii < batches.length; ++ii) {
    let idx = batches.length - 1 - ii; // reversed
    if (sindex < idx) continue;
    let batch = batches[idx];
    if (batch.isBackground) return (batch);
    if (batch.pointInsideBoundings(x, y)) return (batch);
  };
  return null;
};

/**
 * Resize all background batches to stay smoothy
 * @param {Number} width
 * @param {Number} height
 */
export function resizeBackgroundBatches(width, height) {
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    if (!batch.isBackground) continue;
    batch.renderBackground(width, height, batch.bgcolor);
  };
};

/**
 * Check whether a point lies inside the used editor area
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
export function pointInsideAbsoluteBoundings(x, y) {
  let bounds = this.boundings;
  let state = intersectRectangles(
    bounds.x, bounds.y, bounds.w, bounds.h,
    x, y, 0, 0
  );
  return (state);
};

/**
 * @param {Array} batches
 * @return {Object}
 */
export function getAbsoluteBoundings(batches) {
  let px = []; let py = []; let pw = []; let ph = [];
  let sindex = this.sindex;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    if (sindex < ii) continue;
    let info = batch.getBoundings();
    px.push(info.x);
    py.push(info.y);
    pw.push(info.x + info.w);
    ph.push(info.y + info.h);
  };
  px.sort(sortAscending);
  py.sort(sortAscending);
  pw.sort(sortAscending);
  ph.sort(sortAscending);
  // calculate rectangle position
  let xx = px[0]|0;
  let yy = py[0]|0;
  // calculate rectangle size
  let idx = pw.length-1;
  let ww = (-xx + pw[idx]);
  let hh = (-yy + ph[idx]);
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
};

/**
 * Updates the global boundings of our stage, so we
 * always have access to our absolute stage boundings
 */
export function updateGlobalBoundings() {
  let info = this.getAbsoluteBoundings(this.batches);
  let bounds = this.boundings;
  if (
    info.x !== bounds.x ||
    info.y !== bounds.y ||
    info.w !== bounds.w ||
    info.h !== bounds.h
  ) {
    bounds.x = info.x;
    bounds.y = info.y;
    bounds.w = info.w;
    bounds.h = info.h;
  }
};
