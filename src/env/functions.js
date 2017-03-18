import {
  colorToRgbaString,
  createCanvasBuffer,
  alphaByteToRgbAlpha
} from "../utils";

import Batch from "../batch/index";

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getPixelAt(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii; // reversed
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (batch.isEraser) continue;
      if (!batch.bounds.isPointInside(x, y)) continue;
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
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii; // reversed
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (batch.isEraser) continue;
      if (!batch.bounds.isPointInside(x, y)) continue;
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
  batch.isDynamic = true;
  return (batch);
};
