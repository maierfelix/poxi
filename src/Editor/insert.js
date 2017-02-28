import { UNSET_TILE_COLOR } from "../cfg";
import {
  colorsMatch,
  isGhostColor,
  createCanvasBuffer
} from "../utils";

import Texture from "./Batch/Texture/index";

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
    let a = this.getTileAt(x+1, y) || this.getStackRelativeTileColorAt(x+1, y);
    let b = this.getTileAt(x-1, y) || this.getStackRelativeTileColorAt(x-1, y);
    let c = this.getTileAt(x, y+1) || this.getStackRelativeTileColorAt(x, y+1);
    let d = this.getTileAt(x, y-1) || this.getStackRelativeTileColorAt(x, y-1);
    if (a === null) queue.push({x:x+1, y:y});
    if (b === null) queue.push({x:x-1, y:y});
    if (c === null) queue.push({x:x, y:y+1});
    if (d === null) queue.push({x:x, y:y-1});
  };
  return (false);
};

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  // TODO: fix future batches get still recognized...
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  let sIndex = this.sindex;
  // differentiate between empty and colored tiles
  let basecolor = this.getTileColorAt(x, y);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  let infinite = false;
  // try color based filling
  if (basecolor !== null) {
    infinite = this.fillBucketColorBased(x, y, basecolor, color);
  // empty tile based filling
  } else {
    infinite = this.fillBucketEmptyTileBased(x, y, color);
  }
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
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
  this.finalizeBatchOperation();
  if (infinite) {
    // remove our recent batch if it didn't got removed yet
    // e.g. infinity got detected later and some batches got drawn
    if (sIndex < this.sindex) {
      this.undo();
      this.refreshStack();
    }
    this.fillBackground(color);
  }
};

/**
 * Inserts stroked arc at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
export function strokeArc(x, y, radius, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertArc(x, y, radius, color);
};

/**
 * Inserts filled arc at given position
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
export function insertArc(x1, y1, radius, color) {
  let x2 = radius;
  let y2 = 0;
  let err = 1 - x2; 
  this.pushTileBatchOperation();
  for (; x2 >= y2;) {
    this.createBatchTileAt(x2 + x1, y2 + y1, color);
    this.createBatchTileAt(y2 + x1, x2 + y1, color);
    this.createBatchTileAt(-x2 + x1, y2 + y1, color);
    this.createBatchTileAt(-y2 + x1, x2 + y1, color);
    this.createBatchTileAt(-x2 + x1, -y2 + y1, color);
    this.createBatchTileAt(-y2 + x1, -x2 + y1, color);
    this.createBatchTileAt(x2 + x1, -y2 + y1, color);
    this.createBatchTileAt(y2 + x1, -x2 + y1, color);
    y2++;
    if (err <= 0) {
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2--;
      err += 2 * (y2 - x2) + 1;
    }
  };
  this.finalizeBatchOperation();
};

/**
 * Inserts filled rectangle at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function fillRect(x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    x | 0, y | 0,
    width | 0, height | 0,
    color, true
  );
};

/**
 * Inserts stroked rectangle at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function strokeRect(x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    x | 0, y | 0,
    width | 0, height | 0,
    color, false
  );
};

/**
 * Inserts rectangle at given position
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Array} color
 * @param {Boolean} filled
 */
export function insertRectangleAt(x1, y1, x2, y2, color, filled) {
  let width = Math.abs(x2);
  let height = Math.abs(y2);
  this.pushTileBatchOperation();
  let dx = (x2 < 0 ? -1 : 1);
  let dy = (y2 < 0 ? -1 : 1);
  let bx = x1;
  let by = y1;
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      // ignore inner tiles if rectangle not filled
      if (!filled) {
        if (!(
          (xx === 0 || xx >= width-1) ||
          (yy === 0 || yy >= height-1))
        ) continue;
      }
      this.createBatchTileAt(bx + xx * dx, by + yy * dy, color);
    };
  };
  this.finalizeBatchOperation();
};

/**
 * Transforms passed canvas ctx into a single batch operation
 * Instead of drawing tiles for each pixel,
 * we just directly draw all of them into a canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
export function drawImage(ctx, x, y) {
  let canvas = ctx.canvas;
  let width = canvas.width;
  let height = canvas.height;
  let xx = 0;
  let yy = 0;
  // start ctx insertion from given position
  let data = ctx.getImageData(0, 0, width, height).data;
  let position = this.getRelativeOffset(x, y);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  batch.createRawBufferAt(ctx, position.x, position.y);
  this.finalizeBatchOperation();
};
