import {
  SETTINGS,
  MAX_SAFE_INTEGER
} from "../cfg";

import {
  colorToRgbaString,
  createCanvasBuffer,
  alphaByteToRgbAlpha
} from "../utils";

import Batch from "../batch/index";
import CommandKind from "../stack/kind";

export function resetModes() {
  for (let key in this.modes) {
    this.resetSelection();
    this.modes[key] = false;
  };
  this.resetActiveUiButtons();
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
export function insertImage(ctx, x, y) {
  const layer = this.getCurrentLayer();
  const batch = this.createDynamicBatch();
  batch.drawImage(ctx, x, y);
  layer.addBatch(batch);
  this.enqueue(CommandKind.DRAW_IMAGE, batch);
};

/**
 * @return {String}
 */
export function exportAsDataUrl() {
  if (!(this.cache.main instanceof CanvasRenderingContext2D)) return ("");
  const buffer = this.cache.main;
  const view = buffer.canvas;
  return (view.toDataURL("image/png"));
};

/**
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 */
export function insertLine(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 2 : -2;
  const sy = (y0 < y1) ? 2 : -2;
  let err = dx - dy;

  const last = this.last;
  const batch = (
    this.states.drawing ?
    this.buffers.drawing :
    this.buffers.erasing
  );
  while (true) {
    const relative = this.getRelativeTileOffset(x0, y0);
    if (last.mx !== relative.x || last.my !== relative.y) {
      if (this.states.drawing) {
        const w = SETTINGS.PENCIL_SIZE;
        const h = SETTINGS.PENCIL_SIZE;
        batch.drawTile(relative.x, relative.y, w, h, this.fillStyle);
      }
      else if (this.states.erasing) {
        batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
      }
    }
    last.mx = relative.x; last.my = relative.y;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  };
};

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getPixelAt(x, y) {
  const sindex = this.sindex;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii; // reversed
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (batch.isEraser) continue;
      if (!batch.bounds.isPointInside(x, y)) continue;
      if (batch.getStackIndex() > sindex) continue;
      let pixel = batch.getRawPixelAt(x, y);
      if (pixel !== null) return (pixel);
    };
  };
  return (null);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getPixelsAt(x, y) {
  const result = [];
  const sindex = this.sindex;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii; // reversed
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (batch.isEraser) continue;
      if (!batch.bounds.isPointInside(x, y)) continue;
      if (batch.getStackIndex() > sindex) continue;
      let pixel = batch.getRawPixelAt(x, y);
      if (pixel === null) continue;
      result.push({
        x, y,
        batch: batch,
        pixel: pixel
      });
    };
  };
  return ({
    x, y,
    pixels: result
  });
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
export function getLayerByPoint(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    if (layer.bounds.isPointInside(x, y)) return (layer);
  };
  return (null);
};

/**
 * @param {Number} id
 * @return {Batch}
 */
export function getBatchById(id) {
  let result = null;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    let batch = layer.getBatchById(id);
    if (batch !== null) {
      result = batch;
      break;
    }
  };
  return (result);
};

/**
 * @return {Layer}
 */
export function getCurrentLayer() {
  if (this.layers.length) {
    return (this.layers[this.layers.length - 1]);
  }
  return (null);
};

/**
 * @return {Batch}
 */
export function createDynamicBatch() {
  const batch = new Batch(this);
  return (batch);
};

export function refreshMainTexture() {
  this.createMainBuffer();
};

export function updateGlobalBoundings() {
  for (let ii = 0; ii < this.layers.length; ++ii) {
    this.layers[ii].updateBoundings();
  };
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const bounds = layer.bounds;
    const bx = bounds.x; const by = bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // ignore empty layers
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
  };
  // update our boundings
  this.bounds.update(x, y, -x + w, -y + h);
};
