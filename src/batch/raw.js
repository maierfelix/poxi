import { TILE_SIZE } from "../cfg";

import { alignToGrid } from "../math";

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRawPixelAt(x, y) {
  // normalize coordinates
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  // now extract the data
  const data = this.data;
  // imagedata array is 1d
  const idx = (yy * this.bounds.w + xx) * 4;
  // pixel index out of bounds
  if (idx < 0 || idx >= data.length) return (null);
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // finally return the color array
  return (color);
};
