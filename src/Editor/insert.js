import { TILE_SIZE } from "../cfg";
import { alphaByteToRgbAlpha } from "../utils";

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
      let alpha = alphaByteToRgbAlpha(a);
      // create relative batched tile
      let tile = this.createBatchTileAt(
        mx + (xx * TILE_SIZE),
        my + (yy * TILE_SIZE),
        [r,g,b,alpha]
      );
    };
  };
  this.finalizeBatchOperation();
};
