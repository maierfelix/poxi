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
 */
export function finalizeBatchOperation() {
  let offset = this.batches.length - 1;
  let batch = this.batches[offset];
  if (batch.exceedsBounds() && !batch.isRawBuffer) {
    batch.renderBuffer();
  } else {
    // dont push into stack, if nothing has changed
    if (!batch.tiles.length && !batch.isBackground) {
      this.batches.splice(offset, 1);
      this.refreshBatches();
      return;
    }
    // got a background fill batch, check if we have to push it into the stack
    if (batch.isBackground) {
      let last = this.currentStackOperation();
      // last operation was a background fill too, check if their colors match
      if (last && last.batch.isBackground) {
        if (colorsMatch(batch.bgcolor, last.batch.bgcolor)) return;
      }
    }
  }
  this.enqueue({
    batch: batch
  });
  this.refreshBatches();
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
};

/**
 * Get batch by the given tile
 * @param {Tile} tile
 * @return {Batch}
 */
export function getBatchByTile(tile) {
  let id = tile.id;
  let batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    let tiles = batches[ii].tiles;
    for (let jj = 0; jj < tiles.length; ++jj) {
      let tile = tiles[jj];
      if (tile.id === id) return (batches[ii]);
    };
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
  let info = this.getAbsoluteBoundings(this.batches);
  let state = intersectRectangles(
    info.x, info.y, info.w, info.h,
    x, y, 0, 0
  );
  return (state);
};

/**
 * @param {Array} batches
 */
export function getAbsoluteBoundings(batches) {
  let px = []; let py = []; let pw = []; let ph = [];
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
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
