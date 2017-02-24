import {
  TILE_SIZE,
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
  if (batch.exceedsBounds() && !batch.isRawBuffer) {
    batch.renderBuffer();
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
  let otile = this.getTileByPosition(x, y);
  let batch = this.getLatestTileBatchOperation();
  // only push tile if necessary
  if (otile !== null && otile.colorMatchesWithTile(color)) return;
  let tile = this.createTileAt(x, y);
  tile.colors.unshift(color);
  batch.tiles.push(tile);
};
