import { TILE_SIZE } from "../cfg";

import { alignToGrid } from "../math";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
export function drawImage(ctx, x, y) {
  const view = ctx.canvas;
  const ww = view.width;
  const hh = view.height;
  const xx = alignToGrid(x - (ww / 2) | 0);
  const yy = alignToGrid(y - (hh / 2) | 0);
  this.prepareBuffer(xx, yy);
  this.buffer = ctx;
  this.bounds.x = xx;
  this.bounds.y = yy;
  this.bounds.w = ww;
  this.bounds.h = hh;
  this.refreshTexture();
};
