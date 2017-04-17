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
  // differentiate between empty and colored tiles
  const layer = this.getCurrentLayer();
  const bounds = layer.bounds;
  const base = layer.getPixelAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) return;
  // save the current stack index
  const batch = layer.createBatchAt(x, y);
  // flood fill
  let shape = this.getBinaryShape(x, y, base);
  // ups, we filled infinite
  if (shape === null) return;
  // now fill a buffer by our grid data
  const bx = bounds.x + layer.x; const by = bounds.y + layer.y;
  const bw = bounds.w; const bh = bounds.h;
  const bcolor = [color[0], color[1], color[2], color[3]];
  batch.resizeRectangular(
    bx, by,
    bw, bh
  );
  let count = 0;
  // flood fill pixels
  for (let ii = 0; ii < bw * bh; ++ii) {
    const xx = (ii % bw) | 0;
    const yy = (ii / bw) | 0;
    const px = (yy * bw + xx) | 0;
    // only fill active grid pixels
    if (shape[px] !== 2) continue;
    batch.drawPixelFast(bx + xx, by + yy, bcolor);
    count++;
  };
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  // auto resize batch's size by the used pixel data
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.FILL, batch);
  // free grid from memory
  shape = null;
  return;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function floodPaint(x, y) {
  const color = this.fillStyle;
  const layer = this.getCurrentLayer();
  const bounds = layer.bounds;
  const base = layer.getPixelAt(x, y);
  // empty base tile or colors to fill are the same
  if (base === null || colorsMatch(base, color)) return;
  const bx = bounds.x + layer.x; const by = bounds.y + layer.y;
  const bw = bounds.w; const bh = bounds.h;
  const batch = layer.createBatchAt(bx, by);
  batch.resizeRectangular(
    bx, by,
    bw, bh
  );
  let count = 0;
  // flood paint
  for (let ii = 0; ii < bw * bh; ++ii) {
    const xx = (ii % bw);
    const yy = (ii / bw) | 0;
    const pixel = layer.getPixelAt(bx + xx, by + yy);
    if (pixel === null) continue;
    if (!colorsMatch(base, pixel)) continue;
    batch.drawPixelFast(bx + xx, by + yy, color);
    count++;
  };
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.FLOOD_FILL, batch);
  return;
};
