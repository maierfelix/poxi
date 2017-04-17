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
    this.drawPixel(xx, yy, color);
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function drawPixel(x, y, color) {
  this.resizeByOffset(x, y);
  this.drawPixelFast(x, y, color);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function drawPixelFast(x, y, color) {
  const data = this.data;
  const rdata = this.reverse;
  const dx = x - this.layer.x;
  const dy = y - this.layer.y;
  const xx = dx - this.bounds.x;
  const yy = dy - this.bounds.y;
  const idx = 4 * (yy * this.bounds.w + xx);
  const pixel = this.layer.getPixelAt(x, y);
  // save earlier pixel state into reverse matrix
  if (rdata[idx + 3] <= 0 && pixel !== null) {
    rdata[idx + 0] = pixel[0];
    rdata[idx + 1] = pixel[1];
    rdata[idx + 2] = pixel[2];
    rdata[idx + 3] = rgbAlphaToAlphaByte(pixel[3]);
  }
  // overwrite pixel
  data[idx + 0] = color[0];
  data[idx + 1] = color[1];
  data[idx + 2] = color[2];
  data[idx + 3] = rgbAlphaToAlphaByte(color[3]);
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
    this.erasePixel(xx, yy);
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function erasePixel(x, y) {
  const pixel = this.layer.getPixelAt(x, y);
  // nothing to erase
  if (pixel === null) return;
  this.resizeByOffset(x, y);
  this.erasePixelFast(x, y, pixel);
  return;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} pixel - Earlier pixel
 */
export function erasePixelFast(x, y, pixel) {
  const data = this.data;
  const rdata = this.reverse;
  const dx = x - this.layer.x;
  const dy = y - this.layer.y;
  const xx = dx - this.bounds.x;
  const yy = dy - this.bounds.y;
  const idx = 4 * (yy * this.bounds.w + xx);
  // save old pixel into reverse matrix if not set yet
  if (rdata[idx + 3] <= 0) {
    rdata[idx + 0] = pixel[0];
    rdata[idx + 1] = pixel[1];
    rdata[idx + 2] = pixel[2];
    rdata[idx + 3] = rgbAlphaToAlphaByte(pixel[3]);
  }
  // reset pixel data
  data[idx + 0] = 255;
  data[idx + 1] = 255;
  data[idx + 2] = 255;
  data[idx + 3] = 255;
};
