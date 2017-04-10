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
export function resizeByRect(x, y, w, h) {
  this.resizeByOffset(x, y);
  this.resizeByOffset(x + w, y + h);
};

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
  // resize bound rect to left, top
  if (xx < 0) {
    bounds.x += xx;
    bounds.w += Math.abs(xx);
  }
  if (yy < 0) {
    bounds.y += yy;
    bounds.h += Math.abs(yy);
  }
  // resize bound to right, bottom
  if (w > bounds.w) bounds.w = w;
  if (h > bounds.h) bounds.h = h;
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    this.resizeMatrix(
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
 * Merges given matrix
 * @param {Batch} batch
 * @param {Boolean} state - Add or reverse
 */
export function mergeMatrix(batch, state) {
  const buffer = this.data;
  const isEraser = batch.isEraser;
  const data = state ? batch.data : batch.reverse;
  const x = this.bounds.x | 0; const y = this.bounds.y | 0;
  const w = this.bounds.w | 0; const h = this.bounds.h | 0;
  const bw = batch.bounds.w | 0; const bh = batch.bounds.h | 0;
  const bx = (batch.bounds.x - x) | 0; const by = (batch.bounds.y - y) | 0;
  // loop given batch data and merge it with our main matrix
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % bw) | 0;
    const yy = (idx / bw) | 0;
    const opx = ((yy * bw + xx) * 4) | 0;
    const npx = (opx + (yy * (w - bw) * 4) + (bx * 4) + ((by * 4) * w)) | 0;
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
      // redo
      if (state === true) {
        const src = buffer.subarray(npx, npx + 4);
        const dst = data.subarray(opx, opx + 4);
        const color = additiveAlphaColorBlending(src, dst);
        buffer[npx + 0] = color[0];
        buffer[npx + 1] = color[1];
        buffer[npx + 2] = color[2];
        buffer[npx + 3] = color[3];
        continue;
      // undo
      } else {
        
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
