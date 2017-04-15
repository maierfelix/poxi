import { additiveAlphaColorBlending } from "../color";

/**
 * @return {String}
 */
export function exportAsDataUrl() {
  if (!(this.main.buffer instanceof CanvasRenderingContext2D)) return ("");
  const buffer = this.main.buffer;
  const view = buffer.canvas;
  return (view.toDataURL("image/png"));
};
