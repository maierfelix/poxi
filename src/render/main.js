import { createCanvasBuffer } from "../utils";

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
    const pos = layer.getRelativePosition();
    const canvas = layer.toCanvas();
    buffer.drawImage(
      canvas,
      0, 0,
      canvas.width, canvas.height,
      pos.x, pos.y,
      canvas.width, canvas.height
    );
  };
  return (view.toDataURL("image/png"));
};
