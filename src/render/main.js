import { createCanvasBuffer } from "../utils";
import { additiveAlphaColorBlending } from "../color";

/**
 * @return {String}
 */
export function exportAsDataUrl() {
  const layers = this.layers;
  const ww = this.bounds.w; const hh = this.bounds.h;
  const sx = this.bounds.x; const sy = this.bounds.y;
  const buffer = createCanvasBuffer(ww, hh);
  const view = buffer.canvas;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    const xx = (layer.x + layer.bounds.x) - sx;
    const yy = (layer.y + layer.bounds.y) - sy;
    const data = layer.batch.data;
    const lw = layer.bounds.w;
    for (let ii = 0; ii < data.length; ii += 4) {
      const idx = (ii / 4) | 0;
      const x = (idx % lw) | 0;
      const y = (idx / lw) | 0;
      const r = data[ii + 0];
      const g = data[ii + 1];
      const b = data[ii + 2];
      const a = data[ii + 3];
      if (a <= 0) continue;
      buffer.fillStyle = `rgba(${r},${g},${b},${a})`;
      buffer.fillRect(xx + x, yy + y, 1, 1);
    };
  };
  return (view.toDataURL("image/png"));
};
