import { BASE_TILE_COLOR } from "../cfg";

import {
  createCanvasBuffer
} from "../utils";

import {
  colorsMatch,
  rgbAlphaToAlphaByte
} from "../color";

import CommandKind from "../stack/kind";

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  const bounds = this.bounds;
  // differentiate between empty and colored tiles
  const base = this.getPixelAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) return;
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  // save the current stack index
  const sindex = this.sindex;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  // flood fill
  const result = this.getBinaryShape(x, y, base);
  // ups, we filled infinite
  if (result.infinite) return;
  // now fill a buffer by our grid data
  const bx = bounds.x;
  const by = bounds.y;
  const gw = bounds.w;
  const gh = bounds.h;
  const grid = result.grid;
  // convert cropped area into raw buffer
  const data = new Uint8Array(4 * (gw * gh));
  // convert alpha color to alpha byte
  const alpha = rgbAlphaToAlphaByte(color[3]);
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % gw;
    const yy = (idx / gw) | 0;
    const px = (yy * gw + xx) * 4;
    if (grid[idx] !== 2) continue;
    data[px + 0] = color[0];
    data[px + 1] = color[1];
    data[px + 2] = color[2];
    data[px + 3] = alpha;
  };
  // update batch with final result
  batch.data = data;
  batch.bounds.update(bx, by, gw, gh);
  // auto resize batch's size by the used pixel data
  //batch.resizeByMatrixData();
  batch.refreshTexture(true);
  layer.addBatch(batch);
  this.enqueue(CommandKind.FILL, batch);
  // free grid from memory
  result.grid = null;
  return;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function floodPaint(x, y) {
  const color = this.fillStyle;
  const base = this.getPixelAt(x, y);
  // empty base tile or colors to fill are the same
  if (base === null || colorsMatch(base, color)) return;
  const xx = this.bounds.x;
  const yy = this.bounds.y;
  const ww = this.bounds.w;
  const hh = this.bounds.h;
  const layer = this.getCurrentLayer();
  const batch = this.createDynamicBatch();
  batch.prepareBuffer(xx, yy);
  batch.resizeByOffset(xx, yy);
  batch.resizeByOffset(xx + ww, yy + hh);
  // flood paint
  let count = 0;
  for (let ii = 0; ii < ww * hh; ++ii) {
    const x = (ii % ww);
    const y = (ii / ww) | 0;
    const pixel = this.getPixelAt(xx + x, yy + y);
    if (pixel === null) continue;
    if (!colorsMatch(base, pixel)) continue;
    batch.drawTile(xx + x, yy + y, 1, 1, color);
    count++;
  };
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.refreshTexture(false);
  layer.addBatch(batch);
  this.enqueue(CommandKind.FLOOD_FILL, batch);
  return;
};
