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

/**
 * @return {Boolean}
 */
export function workingAreaHasResized() {
  const ox = this.bounds.x; const oy = this.bounds.y;
  const ow = this.bounds.w; const oh = this.bounds.h;
  const nx = this.last.gx; const ny = this.last.gy;
  const nw = this.last.gw; const nh = this.last.gh;
  return (
    ox !== nx || oy !== ny ||
    ow !== nw || oh !== nh
  );
};
