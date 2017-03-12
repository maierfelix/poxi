import { alphaByteToRgbAlpha } from "../utils";

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
export function getBatchByPoint(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (!batch.isPointInside(x, y)) continue;
      if (this.sindex < jdx) continue;
      return (batch);
    };
  };
  return (null);
};

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRawPixelAt(x, y) {
  // normalize coordinates
  const xx = x - this.cx;
  const yy = y - this.cy;
  // abort if point isn't inside our global boundings
  if (
    (xx < 0 || xx >= this.cw) ||
    (yy < 0 || yy >= this.ch)
  ) return (null);
  const batch = this.getBatchByPoint(xx, yy);
  console.log(batch, xx, yy, x, y);
  /*
  // now extract the data
  const data = batch.buffer.data;
  // imagedata array is 1d
  const idx = (yy * this.cw + xx) * 4;
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);*/
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
 * @param {Number} x
 * @param {Number} y
 */
export function drawTileAt(x, y) {
  const layer = this.getLayerByPoint(x, y);
  console.log(layer);
};
