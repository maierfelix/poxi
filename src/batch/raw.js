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
    view: ctx.canvas,
    data: ctx.getImageData(0, 0, view.width, view.height)
  };
};

/**
 * Access cached imageData
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
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);
};
