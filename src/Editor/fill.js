import {
  colorsMatch,
  isGhostColor,
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
  this.refreshStack(); // clear future batches
  let infinite = false;
  let sindex = this.sindex;
  // differentiate between empty and colored tiles
  let baseColor = this.getTileColorAt(x, y);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  // try color based filling
  if (baseColor !== null) {
    infinite = this.fillBucketColorBased(x, y, baseColor, color);
  // empty tile based filling
  } else {
    infinite = this.fillBucketEmptyTileBased(x, y, color);
  }
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
  // we filled tile based
  // create a raw buffer of all tiles and finally free them
  // make sure we only create a raw buffer if we got tiles
  if (batch.tiles.length) {
    let bx = batch.x;
    let by = batch.y;
    let buffer = createCanvasBuffer(batch.width, batch.height);
    for (let ii = 0; ii < batch.tiles.length; ++ii) {
      let tile = batch.tiles[ii];
      let x = tile.x - batch.x;
      let y = tile.y - batch.y;
      buffer.fillStyle = tile.getColorAsRgbaString();
      buffer.fillRect(
        x, y,
        1, 1
      );
    };
    // now draw our staff as a rawbuffer
    batch.createRawBufferAt(buffer, bx, by);
    // free batch tiles to save memory
    batch.tiles = [];
  }
  this.finalizeBatchOperation();
  if (infinite) {
    // remove our recent batch if it didn't got removed yet
    // e.g. infinity got detected later and some batches got drawn
    if (sindex < this.sindex) {
      this.undo();
      this.refreshStack();
    }
    this.fillBackground(color);
  }
};

/**
 * Sets a batch to background, appends the given bg color
 * as well as generates a camera size based buffered canvas
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
  let queue = [{x, y}];
  let batch = this.getLatestTileBatchOperation();
  for (; queue.length > 0;) {
    let point = queue.pop();
    let x = point.x;
    let y = point.y;
    if (!this.pointInsideAbsoluteBoundings(x, y)) {
      // returning true gets handled as infinite fill detection
      return (true);
    }
    // tile is free, so fill in one here
    if (!batch.getTileColorAt(x, y)) batch.createRawTileAt(x, y, color);
    let a = batch.getTileAt(x+1, y) || this.getStackRelativeTileColorAt(x+1, y);
    let b = batch.getTileAt(x-1, y) || this.getStackRelativeTileColorAt(x-1, y);
    let c = batch.getTileAt(x, y+1) || this.getStackRelativeTileColorAt(x, y+1);
    let d = batch.getTileAt(x, y-1) || this.getStackRelativeTileColorAt(x, y-1);
    if (a !== null && colorsMatch(a, base)) queue.push({x:x+1, y:y});
    if (b !== null && colorsMatch(b, base)) queue.push({x:x-1, y:y});
    if (c !== null && colorsMatch(c, base)) queue.push({x:x, y:y+1});
    if (d !== null && colorsMatch(d, base)) queue.push({x:x, y:y-1});
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
    if (!this.pointInsideAbsoluteBoundings(x, y)) {
      // returning true gets handled as infinite fill detection
      return (true);
    }
    // tile is free, so create one here
    if (!batch.getTileColorAt(x, y)) batch.createRawTileAt(x, y, color);
    let a = batch.getTileAt(x+1, y) || this.getStackRelativeTileColorAt(x+1, y);
    let b = batch.getTileAt(x-1, y) || this.getStackRelativeTileColorAt(x-1, y);
    let c = batch.getTileAt(x, y+1) || this.getStackRelativeTileColorAt(x, y+1);
    let d = batch.getTileAt(x, y-1) || this.getStackRelativeTileColorAt(x, y-1);
    if (a === null) queue.push({x:x+1, y:y});
    if (b === null) queue.push({x:x-1, y:y});
    if (c === null) queue.push({x:x, y:y+1});
    if (d === null) queue.push({x:x, y:y-1});
  };
  return (false);
};
