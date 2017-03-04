import {
  colorsMatch,
  isGhostColor,
  colorToRgbaString,
  createCanvasBuffer
} from "../utils";

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  // TODO: add method to create temporary batches (e.g. insertRectangle by mouse)
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  let infinite = false;
  let sindex = this.sindex;
  // differentiate between empty and colored tiles
  let baseColor = this.getTileColorAt(x, y);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  // color based filling
  if (baseColor !== null) {
    infinite = this.fillBucketColorBased(x, y, baseColor, color);
  // empty tile based filling
  } else {
    infinite = this.fillBucketEmptyTileBased(x, y, color);
  }
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
  // make sure we only create a raw buffer if we got tiles to draw onto
  if (batch.tiles.length) this.batchTilesToRawBuffer(batch, color);
  // finalizing a batch also deletes the batch if we didn't change anything
  this.finalizeBatchOperation();
  // infinity got detected, but some batches could be drawn before -> clear them
  if (infinite) {
    // remove our recent batch if it didn't got removed yet
    if (sindex < this.sindex) {
      this.undo();
      this.refreshStack();
    }
    // finally create and finalize a background fill batch
    this.fillBackground(color);
  }
};

/**
 * We filled tile based, create raw buffer of all tiles and finally free them
 * @param {Batch} batch
 * @param {Array} color
 */
export function batchTilesToRawBuffer(batch, color) {
  let bx = batch.x;
  let by = batch.y;
  let length = batch.tiles.length;
  let buffer = createCanvasBuffer(batch.width, batch.height);
  // take main fill color
  buffer.fillStyle = colorToRgbaString(color);
  for (let ii = 0; ii < length; ++ii) {
    let tile = batch.tiles[ii];
    let x = tile.x - batch.x;
    let y = tile.y - batch.y;
    buffer.fillRect(
      x, y,
      1, 1
    );
  };
  // now draw our staff as a rawbuffer
  batch.createRawBufferAt(buffer, bx, by);
  // free batch tiles to save memory
  batch.tiles = [];
};

/**
 * Fill enclosed tile area color based
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Boolean}
 */
export function fillBucketColorBased(x, y, base, color) {
  // clicked tile color and fill colors match, abort
  if (colorsMatch(color, base)) return (false);
  let queue = [];
  let batch = this.getLatestTileBatchOperation();
  queue.push({x, y});
  for (; queue.length > 0;) {
    let point = queue.pop();
    let x = point.x;
    let y = point.y;
    // detected infinite filling, skip and return true=^infinite
    if (!this.pointInsideAbsoluteBoundings(x, y)) return (true);
    // tile is free, so fill in one here
    if (batch.getTileColorAt(x, y) === null) batch.createRawTileAt(x, y, color);
    let n = this.getTileColorAt(x, y-1);
    let e = this.getTileColorAt(x+1, y);
    let s = this.getTileColorAt(x, y+1);
    let w = this.getTileColorAt(x-1, y);
    if (n !== null && colorsMatch(n, base)) queue.push({x:x, y:y-1});
    if (e !== null && colorsMatch(e, base)) queue.push({x:x+1, y:y});
    if (s !== null && colorsMatch(s, base)) queue.push({x:x, y:y+1});
    if (w !== null && colorsMatch(w, base)) queue.push({x:x-1, y:y});
  };
  return (false);
};

/**
 * Fill enclosed tile area empty tile based
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Boolean}
 */
export function fillBucketEmptyTileBased(x, y, color) {
  let queue = [{x, y}];
  let batch = this.getLatestTileBatchOperation();
  for (; queue.length > 0;) {
    let point = queue.pop();
    let x = point.x;
    let y = point.y;
    // detected infinite filling, skip and return true=^infinite
    if (!this.pointInsideAbsoluteBoundings(x, y)) return (true);
    // tile is free, so create one here
    if (!this.getTileAt(x, y)) batch.createRawTileAt(x, y, color);
    let n = this.getTileAt(x, y-1);
    let e = this.getTileAt(x+1, y);
    let s = this.getTileAt(x, y+1);
    let w = this.getTileAt(x-1, y);
    if (n === null) queue.push({x:x, y:y-1});
    if (e === null) queue.push({x:x+1, y:y});
    if (s === null) queue.push({x:x, y:y+1});
    if (w === null) queue.push({x:x-1, y:y});
  };
  return (false);
};

/**
 * Sets a batch to background, appends the given bg color
 * and generates a camera width and height based buffered canvas
 * @param {Array} color
 */
export function fillBackground(color) {
  let isempty = isGhostColor(color);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  batch.isBackground = true;
  batch.renderBackground(this.camera.width, this.camera.height, color);
  batch.updateBoundings();
  this.finalizeBatchOperation();
};
