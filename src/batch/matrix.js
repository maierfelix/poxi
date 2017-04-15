import {
  MAX_SAFE_INTEGER,
  BATCH_JUMP_RESIZE
} from "../cfg";

import {
  alphaByteToRgbAlpha,
  additiveAlphaColorBlending
} from "../color";

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
export function resizeRectangular(x, y, w, h) {
  this.resizeByOffset(x, y);
  this.resizeByOffset(x + w, y + h);
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function resizeByOffset(x, y) {
  const layer = this.layer;
  const bounds = this.bounds;
  let bx = layer.x + bounds.x; let by = layer.y + bounds.y;
  const w = (Math.abs(bx - x) | 0) + 1;
  const h = (Math.abs(by - y) | 0) + 1;
  const ox = bx; const oy = by;
  const ow = bounds.w; const oh = bounds.h;
  const xx = -(bx - x) | 0;
  const yy = -(by - y) | 0;
  // resize bound rect to left, top
  if (xx < 0) {
    bx += xx - BATCH_JUMP_RESIZE;
    bounds.w += Math.abs(xx) + BATCH_JUMP_RESIZE;
  }
  if (yy < 0) {
    by += yy - BATCH_JUMP_RESIZE;
    bounds.h += Math.abs(yy) + BATCH_JUMP_RESIZE;
  }
  // resize bound to right, bottom
  if (w > bounds.w) bounds.w = w + BATCH_JUMP_RESIZE;
  if (h > bounds.h) bounds.h = h + BATCH_JUMP_RESIZE;
  bounds.x = bx; bounds.y = by;
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    this.resizeMatrix(
      ox - bx, oy - by,
      bounds.w - ow, bounds.h - oh
    );
  }
};

/**
 * Resizes matrix by calculating min/max of x,y,w,h
 * @return {Void}
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
  let count = 0;
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
    count++;
  };
  const nx = (w - (-x + w));
  const ny = (h - (-y + h));
  const nbx = bounds.x + nx; const nby = bounds.y + ny;
  const nbw = (-x + w) + 1; const nbh = (-y + h) + 1;
  // abort if nothing has changed
  if (count <= 0) return;
  if (ox === nbx && oy === nby && ow === nbw && oh === nbh) return;
  bounds.x = nbx; bounds.y = nby;
  bounds.w = nbw; bounds.h = nbh;
  this.resizeMatrix(
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
 * @return {Void}
 */
export function resizeMatrix(x, y, w, h) {
  const data = this.data;
  const rdata = this.reverse;
  const nw = this.bounds.w; const nh = this.bounds.h;
  const ow = nw - w; const oh = nh - h;
  const size = 4 * (nw * nh);
  const buffer = new Uint8Array(size);
  const reverse = new Uint8Array(size);
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % ow;
    const yy = (idx / ow) | 0;
    const opx = (yy * ow + xx) * 4;
    // black magic 🦄
    const npx = opx + (yy * (nw - ow) * 4) + (x * 4) + ((y * 4) * nw);
    if (data[opx + 3] <= 0) continue;
    // refill data
    buffer[npx + 0] = data[opx + 0];
    buffer[npx + 1] = data[opx + 1];
    buffer[npx + 2] = data[opx + 2];
    buffer[npx + 3] = data[opx + 3];
    if (rdata[opx + 3] <= 0) continue;
    // refill reverse data
    reverse[npx + 0] = rdata[opx + 0];
    reverse[npx + 1] = rdata[opx + 1];
    reverse[npx + 2] = rdata[opx + 2];
    reverse[npx + 3] = rdata[opx + 3];
  };
  this.data = buffer;
  this.reverse = reverse;
  this.refreshTexture(true);
  return;
};

/**
 * Merges given matrix
 * @param {Batch} batch
 * @param {Number} px - X-offset to merge at
 * @param {Number} py - Y-offset to merge at
 * @param {Boolean} state - Add or reverse
 */
export function injectMatrix(batch, state) {
  const buffer = this.data;
  const layer = batch.layer;
  const isEraser = batch.isEraser;
  const data = state ? batch.data : batch.reverse;
  const bw = batch.bounds.w | 0;
  const dx = (batch.bounds.x - this.bounds.x) | 0;
  const dy = (batch.bounds.y - this.bounds.y) | 0;
  const w = this.bounds.w | 0; const h = this.bounds.h | 0;
  const x = this.bounds.x | 0; const y = this.bounds.y | 0;
  // loop given batch data and merge it with our main matrix
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % bw) | 0;
    const yy = (idx / bw) | 0;
    const opx = ((yy * bw + xx) * 4) | 0;
    const npx = (opx + (yy * (w - bw) * 4) + (dx * 4) + ((dy * 4) * w)) | 0;
    const alpha = data[opx + 3] | 0;
    // erase pixel
    if (isEraser === true) {
      if (state === true && alpha > 0) {
        buffer[npx + 0] = buffer[npx + 1] = buffer[npx + 2] = buffer[npx + 3] = 0;
        continue;
      }
    }
    // ignore empty data pixels
    if (alpha <= 0 && state === true) continue;
    // only overwrite the reverse batch's used pixels
    if (state === false && alpha <= 0 && batch.data[opx + 3] <= 0) continue;
    // manual color blending
    if (buffer[npx + 3] > 0 && alpha < 255 && alpha > 0) {
      // redo, additive blending
      if (state === true) {
        const src = buffer.subarray(npx, npx + 4);
        const dst = data.subarray(opx, opx + 4);
        const color = additiveAlphaColorBlending(src, dst);
        buffer[npx + 0] = color[0];
        buffer[npx + 1] = color[1];
        buffer[npx + 2] = color[2];
        buffer[npx + 3] = color[3];
        continue;
      // undo, reverse blending
    } else {
        const src = buffer.subarray(npx, npx + 4);
        const dst = data.subarray(opx, opx + 4);
        const color = additiveAlphaColorBlending(src, dst);
        buffer[npx + 0] = color[0];
        buffer[npx + 1] = color[1];
        buffer[npx + 2] = color[2];
        buffer[npx + 3] = color[3];
        continue;
      }
    }
    // just fill colors with given batch data kind
    buffer[npx + 0] = data[opx + 0];
    buffer[npx + 1] = data[opx + 1];
    buffer[npx + 2] = data[opx + 2];
    buffer[npx + 3] = data[opx + 3];
  };
};

/**
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

/**
 * Clears all pixels non-reversible
 */
export function clear() {
  const data = this.data;
  for (let ii = 0; ii < data.length; ++ii) {
    data[ii] = 0;
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function prepareMatrix(x, y) {
  const bounds = this.bounds;
  // we don't have a buffer to store data at yet
  if (this.data === null) {
    bounds.x = x;
    bounds.y = y;
    bounds.w = 1;
    bounds.h = 1;
    const size = 4 * (bounds.w * bounds.h);
    this.data = new Uint8Array(size);
    this.reverse = new Uint8Array(size);
    this.texture = this.instance.bufferTexture(this.id, this.data, bounds.w, bounds.h);
  }
};

/**
 * Returns the very first found pixel color
 * *We expect that the batch is single colored*
 * @return {Uint8Array}
 */
export function getBatchColor() {
  const data = this.data;
  const bounds = this.bounds;
  const bw = bounds.w; const bh = bounds.h;
  const color = new Uint8Array(4);
  // calculate batch color
  for (let ii = 0; ii < bw * bh; ++ii) {
    const xx = ii % bw;
    const yy = (ii / bw) | 0;
    const px = 4 * (yy * bw + xx);
    if (data[px + 3] <= 0) continue;
    color[0] = data[px + 0];
    color[1] = data[px + 1];
    color[2] = data[px + 2];
    color[3] = data[px + 3];
    break;
  };
  return (color);
};

/**
 * @return {Boolean}
 */
export function isEmpty() {
  const data = this.data;
  const bw = this.bounds.w;
  let count = 0;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    const a = data[px + 3];
    // ignore empty tiles
    if (a <= 0) continue;
    count++;
  };
  return (count <= 0);
};
