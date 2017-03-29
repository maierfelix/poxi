import { SETTINGS } from "../../cfg";

import {
  colorsMatch,
  colorToRgbaString,
} from "../../utils";

import CommandKind from "../../stack/kind";

/**
 * Shade or tint
 * @param {Number} x
 * @param {Number} y
 * @param {Number} factor
 */
export function applyColorLightness(x, y, factor) {
  const instance = this.instance;
  const bounds = this.bounds;
  const w = SETTINGS.LIGHT_SIZE;
  const h = SETTINGS.LIGHT_SIZE;
  const pixels = [];
  for (let ii = 0; ii < w * h; ++ii) {
    const xx = x + (ii % w);
    const yy = y + (ii / w) | 0;
    this.resizeByOffset(xx, yy);
    // immediately update our buffer data, so we work
    // with the most recent pixels (see getPixelAt, drawTile)
    this.data = this.buffer.getImageData(0, 0, bounds.w, bounds.h).data;
    const pixel = instance.getPixelAt(xx, yy);
    if (pixel === null) continue;
    const t = factor < 0 ? 0 : 255;
    const p = factor < 0 ? -factor : factor;
    const r = (Math.round((t - pixel[0]) * p) + pixel[0]);
    const g = (Math.round((t - pixel[1]) * p) + pixel[1]);
    const b = (Math.round((t - pixel[2]) * p) + pixel[2]);
    const a = pixel[3];
    this.drawSilentTile(xx, yy, 1, 1, [r, g, b, a]);
  };
};
