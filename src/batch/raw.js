import { alphaByteToRgbAlpha } from "../utils";

/**
 * @param {CanvasRenderingContext2D}
 * @param {Number} x
 * @param {Number} y
 */
export function createRawBufferAt(ctx, x, y) {
  const view = ctx.canvas;
  this.bounds.update(x, y, view.width, view.height);
  this.isBuffered = true;
  this.isRawBuffer = true;
  this.isBackground = false;
  this.buffer = {
    ctx,
    view: ctx.view,
    data: ctx.getImageData(0, 0, view.width, view.height)
  };
};

/**
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRawColorAt(x, y) {
  const bounds = this.bounds;
  // normalize our point
  const xx = x - bounds.x;
  const yy = y - bounds.y;
  // abort if point isn't inside our buffer boundings
  if (
    (xx < 0 || xx >= bounds.w) ||
    (yy < 0 || yy >= bounds.h)
  ) return (null);
  // now extract the data
  const data = this.buffer.data;
  // imagedata array is 1d
  const idx = (yy * bounds.w + xx) * 4;
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return ([r, g, b, alphaByteToRgbAlpha(a)]);
};
