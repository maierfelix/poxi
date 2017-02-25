import { alphaByteToRgbAlpha } from "../utils";

import Texture from "./Batch/Texture/index";

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  let queue = [{x, y}];
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  while (queue.length) {
    let point = queue.pop();
    let x = point.x;
    let y = point.y;
    // tile not colored yet
    if (batch.getTileColorAt(x, y)[3] === 2) {
      this.createBatchTileAt(x, y, color);
    }
    if (!this.getTileAt(x+1, y)) queue.push({x:x+1, y:y});
    if (!this.getTileAt(x-1, y)) queue.push({x:x-1, y:y});
    if (!this.getTileAt(x, y+1)) queue.push({x:x, y:y+1});
    if (!this.getTileAt(x, y-1)) queue.push({x:x, y:y-1});
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
  let mx = position.x;
  let my = position.y;
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  batch.isBuffered = true;
  batch.isRawBuffer = true;
  batch.buffer = new Texture(ctx, mx, my);
  this.finalizeBatchOperation();
};
