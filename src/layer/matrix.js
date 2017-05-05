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

/**
 * Updates the layer's boundings by calculating
 * min/max of x,y,w,h of all stored batches
 */
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
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  // normalize coordinates
  const dx = (x - this.x) | 0;
  const dy = (y - this.y) | 0;
  const xx = dx - this.bounds.x;
  const yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) return (null);
  // now get the pixel from the layer matrix
  return (this.batch.getRawPixelAt(dx, dy));
};

/**
 * Access live pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getLivePixelAt(x, y) {
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  // normalize coordinates
  const dx = (x - this.x) | 0;
  const dy = (y - this.y) | 0;
  const xx = dx - this.bounds.x;
  const yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) return (null);
  for (let ii = 0; ii < this.batches.length; ++ii) {
    const idx = (this.batches.length - 1) - ii;
    const batch = this.batches[idx];
    const pixel = batch.getRawPixelAt(dx, dy);
    if (pixel !== null) return (pixel);
  };
  return (null);
};

/**
 * Merges two layers
 * Resize this by layer<->this bounding diff
 * Inject this matrix into layer matrix at layer bound pos
 * @param {Layer} olayer
 * @return {Batch}
 */
export function mergeWithLayer(olayer) {
  const layer = olayer.clone();
  // TODO: fix merging referenced layers
  const main = this.batch;
  const opacity = this.opacity;
  const ldata = layer.batch.data;
  const lw = layer.bounds.w;
  const lh = layer.bounds.h;
  const lx = layer.x + layer.bounds.x;
  const ly = layer.y + layer.bounds.y;
  const sx = this.x + this.bounds.x;
  const sy = this.y + this.bounds.y;
  const dx = sx - lx; const dy = sy - ly;
  const bx = sx - dx; const by = sy - dy;
  const batch = this.createBatchAt(bx, by);
  // pre-resize batch
  batch.bounds.w = lw;
  batch.bounds.h = lh;
  // allocate pixel memory
  batch.data = new Uint8Array(ldata.length);
  batch.reverse = new Uint8Array(ldata.length);
  // draw batch matrix into layer matrix
  // and save earlier state
  for (let ii = 0; ii < ldata.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % lw) | 0;
    const yy = (idx / lw) | 0;
    const pixel = layer.getPixelAt(lx + xx, ly + yy);
    if (pixel === null) continue;
    //console.log(pixel[3], layer.oapcity);
    pixel[3] = pixel[3] * (opacity * layer.opacity);
    batch.drawPixelFast(lx + xx, ly + yy, pixel);
  };
  batch.refreshTexture(true);
  return (batch);
};
