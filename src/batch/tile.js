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
  const xpad = Math.ceil(size / 2);
  const ypad = Math.ceil(size / 2);
  this.drawTile(
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
export function drawTile(x, y, w, h, color) {
  const bounds = this.bounds;
  this.resizeByOffset(x, y);
  // resize a second time to update boundings to given w,h
  if (w > 1 || h > 1) {
    this.resizeByOffset(x + w - 1, y + h - 1);
  }
  // => fillRect(x, y, w, h)
  // TODO: Fix dat
  for (let ii = 0; ii < w * h; ++ii) {
    const xx = (x - bounds.x) + ii;
    const yy = (y - bounds.y) + ii;
    const idx = (yy * bounds.w + xx) * 4;
    this.data[idx + 0] = color[0];
    this.data[idx + 1] = color[1];
    this.data[idx + 2] = color[2];
    this.data[idx + 3] = rgbAlphaToAlphaByte(color[3]);
  };
};

/**
 * Fastest way to draw a tile
 * This method doesnt do auto resizing!
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
export function drawSilentTile(x, y, w, h, color) {
  const bounds = this.bounds;
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    w, h
  );
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
  const batches = [];
  const bounds = this.bounds;
  const instance = this.instance;
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
  const idx = (yy * bounds.w + xx) * 4;
  this.data[idx + 0] = 255;
  this.data[idx + 1] = 255;
  this.data[idx + 2] = 255;
  this.data[idx + 3] = 255;
  return;
};
