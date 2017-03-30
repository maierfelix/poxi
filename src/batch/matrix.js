import {
  MAX_SAFE_INTEGER,
  BATCH_JUMP_RESIZE
} from "../cfg";

import { alphaByteToRgbAlpha } from "../color";

/**
 * @param {Number} x
 * @param {Number} y
 */
export function resizeByOffset(x, y) {
  const bounds = this.bounds;
  const w = (Math.abs(bounds.x - x) | 0) + 1;
  const h = (Math.abs(bounds.y - y) | 0) + 1;
  const ox = bounds.x; const oy = bounds.y;
  const ow = bounds.w; const oh = bounds.h;
  const xx = -(bounds.x - x) | 0;
  const yy = -(bounds.y - y) | 0;
  // resize jump factor
  const factor = Math.round(BATCH_JUMP_RESIZE / this.instance.cr);
  // resize bound rect to left, top
  if (xx < 0) {
    bounds.x += xx - factor;
    bounds.w += Math.abs(xx - factor);
  }
  if (yy < 0) {
    bounds.y += yy - factor;
    bounds.h += Math.abs(yy - factor);
  }
  // resize bound to right, bottom
  if (w > bounds.w) bounds.w = w + factor;
  if (h > bounds.h) bounds.h = h + factor;
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    this.resizeArrayBuffer(
      ox - bounds.x, oy - bounds.y,
      bounds.w - ow, bounds.h - oh
    );
  }
};

/**
 * Resizes matrix by calculating min/max of x,y,w,h
 */
export function resizeByMatrixData() {
  const data = this.data;
  const bounds = this.bounds;
  const bx = bounds.x; const by = bounds.y;
  const bw = bounds.w; const bh = bounds.h;
  const ox = bounds.x; const oy = bounds.y;
  const ow = bounds.w; const oh = bounds.h;
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    const r = data[px + 0];
    const g = data[px + 1];
    const b = data[px + 2];
    const a = data[px + 3];
    // ignore empty tiles
    if (a <= 0) continue;
    // x, y
    if (xx >= 0 && xx <= x) x = xx;
    if (yy >= 0 && yy <= y) y = yy;
    // width, height
    if (xx >= 0 && xx >= w) w = xx;
    if (yy >= 0 && yy >= h) h = yy;
  };
  const nx = (w - (-x + w));
  const ny = (h - (-y + h));
  const nbx = bounds.x + nx; const nby = bounds.y + ny;
  const nbw = (-x + w) + 1; const nbh = (-y + h) + 1;
  // abort if nothing has changed
  if (ox === nbx && oy === nby && ow === nbw && oh === nbh) return;
  bounds.x = nbx; bounds.y = nby;
  bounds.w = nbw; bounds.h = nbh;
  this.resizeArrayBuffer(
    ox - nbx, oy - nby,
    nbw - ow, nbh - oh
  );
  return;
};

/**
 * Resize internal array buffers
 * and join old matrix with new one
 * @param {Number} x - Resize left
 * @param {Number} y - Resize top
 * @param {Number} w - Resize right
 * @param {Number} h - Resize bottom
 */
export function resizeArrayBuffer(x, y, w, h) {
  const data = this.data;
  const nw = this.bounds.w; const nh = this.bounds.h;
  const ow = nw - w; const oh = nh - h;
  const buffer = new Uint8Array(4 * (nw * nh));
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % ow;
    const yy = (idx / ow) | 0;
    const opx = (yy * ow + xx) * 4;
    const npx = opx + (yy * (nw - ow) * 4) + (x * 4) + ((y * 4) * nw);
    buffer[npx + 0] = data[opx + 0];
    buffer[npx + 1] = data[opx + 1];
    buffer[npx + 2] = data[opx + 2];
    buffer[npx + 3] = data[opx + 3];
  };
  this.data = buffer;
  this.refreshTexture(true);
};

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
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // finally return the color array
  return (color);
};
