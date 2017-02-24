import { TILE_SIZE } from "../cfg";
import { alphaByteToRgbAlpha } from "../utils";

import Texture from "./Batch/Texture/index";

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
  let batch = this.getLatestTileBatchOperation();
  let dx = (x2 < 0 ? -1 : 1);
  let dy = (y2 < 0 ? -1 : 1);
  let x = x1 * TILE_SIZE;
  let y = y1 * TILE_SIZE;
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      // ignore inner tiles if rectangle not filled
      if (!filled) {
        if (!(
          (xx === 0 || xx >= width-1) ||
          (yy === 0 || yy >= height-1))
        ) continue;
      }
      this.createBatchTileAt(x + ((xx * TILE_SIZE)) * dx, y + ((yy * TILE_SIZE)) * dy, color);
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
  batch.isBuffered = true;
  batch.isRawBuffer = true;
  batch.buffer = new Texture(ctx, mx / TILE_SIZE, my / TILE_SIZE);
  this.finalizeBatchOperation();
};
