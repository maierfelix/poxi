import { SELECTION_COLOR } from "../cfg";

import {
  bytesToRgba,
  colorToRgbaString,
  createCanvasBuffer
} from "../utils";

import CommandKind from "../stack/kind";

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} pixels
 * @return {Void}
 */
export function paste(x, y, pixels) {
  if (pixels === null || !pixels.length) return;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  batch.prepareBuffer(x, y);
  for (let ii = 0; ii < pixels.length; ++ii) {
    const pixel = pixels[ii];
    const color = pixel.color;
    batch.drawTile(pixel.x + x, pixel.y + y, 1, 1, color);
  };
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.PASTE, batch);
  return;
};

/**
 * @param {Object} selection
 */
export function copy(selection) {
  this.clipboard.copy = null;
  // shape based selection
  if (selection.shape !== null) {
    this.copyByShape(selection);
  } else {
    this.copyBySelection(selection);
  }
};

/**
 * Shape-based copying
 * @param {Object} selection
 */
export function copyByShape(selection) {
  const shape = selection.shape;
  const data = shape.data;
  const bx = shape.bounds.x; const by = shape.bounds.y;
  const bw = shape.bounds.w; const bh = shape.bounds.h;
  let pixels = [];
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    const alpha = data[px + 3];
    // ignore shape pixels that aren't used
    if (alpha <= 0) continue;
    const pixel = this.getPixelAt(bx + xx, by + yy);
    if (pixel === null) continue;
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  };
  this.clipboard.copy = pixels;
};

/**
 * Rectangle-based copying
 * @param {Object} selection
 */
export function copyBySelection(selection) {
  const x = selection.x; const y = selection.y;
  const w = selection.w; const h = selection.h;
  let pixels = [];
  for (let ii = 0; ii < w * h; ++ii) {
    let xx = ii % w;
    let yy = (ii / w) | 0;
    let pixel = this.getPixelAt(x + xx, y + yy);
    if (pixel === null) continue;
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  };
  this.clipboard.copy = pixels;
};

/**
 * @param {Object} selection
 * @return {Void}
 */
export function cut(selection) {
  this.copy(selection);
  const pixels = this.clipboard.copy;
  if (pixels === null || !pixels.length) return;
  this.clearRect(selection);
  return;
};

/**
 * @param {Object} selection
 * @return {Void}
 */
export function clearRect(selection) {
  const x = selection.x; const y = selection.y;
  const w = selection.w; const h = selection.h;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  batch.isEraser = true;
  batch.prepareBuffer(x, y);
  // clear by shape
  if (selection.shape !== null) {
    this.clearByShape(selection);
    return;
  }
  // clear by rectangle
  batch.clearRect(x, y, w, h);
  batch.refreshTexture();
  // empty batch, got no tiles to delete
  if (batch.isEmpty()) return;
  layer.addBatch(batch);
  this.enqueue(CommandKind.CLEAR, batch);
  return;
};

/**
 * Shape-based clearing
 * @param {Object} selection 
 */
export function clearByShape(selection) {
  const shape = selection.shape;
  const bounds = shape.bounds;
  const data = shape.data;
  const batches = [];
  const x = selection.x; const y = selection.y;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  batch.isEraser = true;
  batch.prepareBuffer(x, y);
  const bw = bounds.w; const bh = bounds.h;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    if (data[px + 3] <= 0) continue;
    const erased = batch.eraseTileAt(xx + x, yy + y);
    for (let jj = 0; jj < erased.length; ++jj) {
      const batch = erased[jj];
      if (batches.indexOf(batch) <= -1) batches.push(batch);
    };
  };
  for (let ii = 0; ii < batches.length; ++ii) {
    batches[ii].refreshTexture();
  };
  if (batch.isEmpty()) return;
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.CLEAR, batch);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
export function getShapeByOffset(x, y) {
  const color = this.getPixelAt(x, y);
  if (color === null) return (null);
  const result = this.getBinaryShape(x, y, color);
  if (result.infinite) return (null);
  const batch = this.createDynamicBatch();
  const bounds = this.bounds;
  const grid = result.grid;
  const bx = bounds.x;
  const by = bounds.y;
  const bw = bounds.w;
  const bh = bounds.h;
  // create buffer to draw a fake shape into
  const buffer = createCanvasBuffer(bw, bh);
  const rgba = bytesToRgba(SELECTION_COLOR);
  rgba[3] = 0.45;
  buffer.fillStyle = colorToRgbaString(rgba);
  for (let ii = 0; ii < grid.length; ++ii) {
    const xx = (ii % bw);
    const yy = (ii / bw) | 0;
    if (grid[yy * bw + xx] !== 2) continue;
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  };
  batch.buffer = buffer;
  batch.data = buffer.getImageData(0, 0, bw, bh).data;
  batch.bounds.update(bx, by, bw, bh);
  batch.resizeByMatrixData();
  batch.refreshTexture(true);
  return (batch);
};
