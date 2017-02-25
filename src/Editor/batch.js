import {
  UNSET_TILE_COLOR,
  BATCH_BUFFER_SIZE
} from "../cfg";

import { createCanvasBuffer } from "../utils";

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
    if (!batch.tiles.length) {
      this.batches.splice(offset, 1);
      this.refreshBatches();
      return;
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
  batch.tiles.push(tile);
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
