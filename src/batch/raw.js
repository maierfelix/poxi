import { TILE_SIZE } from "../cfg";

import { alignToGrid } from "../math";

import { alphaByteToRgbAlpha } from "../utils";

/**
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRawPixelAt(x, y) {
  // normalize coordinates
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  // now extract the data
  const data = this.data;
  // imagedata array is 1d
  const idx = (yy * this.bounds.w + xx) * 4;
  // pixel index out of bounds
  if (idx < 0 || idx >= data.length) return (null);
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);
};

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
