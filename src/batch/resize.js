import { MAX_SAFE_INTEGER } from "../cfg";
import { createCanvasBuffer } from "../utils";

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
  // resize bound rect to left
  if (xx < 0) {
    bounds.x += xx;
    bounds.w += Math.abs(xx);
  }
  // resize bound rect to top
  if (yy < 0) {
    bounds.y += yy;
    bounds.h += Math.abs(yy);
  }
  if (w > bounds.w) bounds.w = w;
  if (h > bounds.h) bounds.h = h;
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    // create new resized buffer and draw old content into it
    const buffer = createCanvasBuffer(bounds.w, bounds.h);
    buffer.drawImage(
      this.buffer.canvas,
      ox - bounds.x, oy - bounds.y,
      ow, oh
    );
    // now set our new buffer to our final buffer
    // with the new size as well as the old content
    this.buffer = buffer;
    this.isResized = true;
  }
};

export function resizeByBufferData() {
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
    if (a <= 0 || (r + g + b + a <= 0)) continue;
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
  // redraw the old buffer without the resized tiles
  const buffer = createCanvasBuffer(bounds.w, bounds.h);
  buffer.drawImage(
    this.buffer.canvas,
    -nx, -ny
  );
  this.buffer = buffer;
  // trigger a full resize of our buffer
  this.isResized = true;
  return;
};
