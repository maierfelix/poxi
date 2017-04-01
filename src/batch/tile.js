import { isPowerOfTwo } from "../math";

import {
  colorToRgbaString,
  rgbAlphaToAlphaByte
} from "../color";

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 * @param {Array} color 
 */
export function drawAt(x, y, size, color) {
  const xpad = Math.floor(size / 2);
  const ypad = Math.floor(size / 2);
  this.fillRect(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
export function fillRect(x, y, w, h, color) {
  for (let ii = 0; ii < w * h; ++ii) {
    const xx = (ii % w) + x;
    const yy = ((ii / w) | 0) + y;
    this.drawTileAt(xx, yy, color);
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function drawTileAt(x, y, color) {
  const bounds = this.bounds;
  const main = this.instance.main.data;
  this.resizeByOffset(x, y);
  // coordinates at this batch
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  const idx = 4 * (yy * bounds.w + xx);
  this.data[idx + 0] = color[0];
  this.data[idx + 1] = color[1];
  this.data[idx + 2] = color[2];
  this.data[idx + 3] = rgbAlphaToAlphaByte(color[3]);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
export function drawTile(x, y, w, h, color) {
  const bounds = this.bounds;
  this.resizeByOffset(x, y);
  // resize a second time to update boundings to given w,h
  if (w > 1 || h > 1) {
    this.resizeByOffset(x + w - 1, y + h - 1);
  }
  const xx = (x - bounds.x);
  const yy = (y - bounds.y);
  const idx = 4 * (yy * bounds.w + xx);
  this.data[idx + 0] = color[0];
  this.data[idx + 1] = color[1];
  this.data[idx + 2] = color[2];
  this.data[idx + 3] = rgbAlphaToAlphaByte(color[3]);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 */
export function clearAt(x, y, size) {
  const xpad = Math.floor(size / 2);
  const ypad = Math.floor(size / 2);
  this.clearRect(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
export function clearRect(x, y, w, h) {
  for (let ii = 0; ii < w * h; ++ii) {
    const xx = (ii % w) + x;
    const yy = ((ii / w) | 0) + y;
    this.eraseTileAt(xx, yy);
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function eraseTileAt(x, y) {
  const bounds = this.bounds;
  const main = this.instance.main.data;
  const pixel = this.instance.getPixelAt(x, y);
  if (pixel === null) return;
  this.resizeByOffset(x, y);
  // coordinates at this batch
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  const idx = 4 * (yy * bounds.w + xx);
  this.data[idx + 0] = 255;
  this.data[idx + 1] = 255;
  this.data[idx + 2] = 255;
  this.data[idx + 3] = 255;
  return;
};
