import { MAX_SAFE_INTEGER } from "../cfg";
import { alphaByteToRgbAlpha } from "../color";

/**
 * @return {Boolean}
 */
export function hasResized() {
  const ox = this.bounds.x; const oy = this.bounds.y;
  const ow = this.bounds.w; const oh = this.bounds.h;
  const nx = this.last.x; const ny = this.last.y;
  const nw = this.last.w; const nh = this.last.h;
  return (
    ox !== nx || oy !== ny ||
    ow !== nw || oh !== nh
  );
};

export function updateBoundings() {
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  const batches = this.batches;
  let count = 0;
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    const bx = bounds.x; const by = bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // ignore empty batches
    if (bounds.w === 0 && bounds.h === 0) continue;
    // calculate x
    if (x < 0 && bx < x) x = bx;
    else if (x >= 0 && (bx < 0 || bx < x)) x = bx;
    // calculate y
    if (y < 0 && by < y) y = by;
    else if (y >= 0 && (by < 0 || by < y)) y = by;
    // calculate width
    if (bw > w) w = bw;
    // calculate height
    if (bh > h) h = bh;
    count++;
  };
  // update our boundings
  if (count > 0) {
    const bounds = this.bounds;
    this.last.x = bounds.x; this.last.y = bounds.y;
    this.last.w = bounds.w; this.last.h = bounds.h;
    bounds.update(
      x, y,
      -x + w, -y + h
    );
  }
  if (this.hasResized()) {
    const main = this.batch;
    main.bounds.update(
      this.bounds.x, this.bounds.y,
      this.bounds.w, this.bounds.h
    );
    const xx = this.last.x; const yy = this.last.y;
    const ww = this.last.w; const hh = this.last.h;
    main.resizeMatrix(
      xx - this.bounds.x, yy - this.bounds.y,
      this.bounds.w - ww, this.bounds.h - hh
    );
  }
};

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getPixelAt(x, y) {
  const batch = this.batch;
  const bw = batch.bounds.w;
  const bh = batch.bounds.h;
  const lx = this.x;
  const ly = this.y;
  // normalize coordinates
  const xx = x - (lx + batch.bounds.x);
  const yy = y - (ly + batch.bounds.y);
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) return (null);
  // now extract the data
  const data = batch.data;
  // imagedata array is 1d
  const idx = (yy * bw + xx) * 4;
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
