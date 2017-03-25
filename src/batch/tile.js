import { isPowerOfTwo } from "../math";
import { colorToRgbaString } from "../utils";

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 * @param {Array} color 
 */
export function drawAt(x, y, size, color) {
  const xpad = Math.ceil(size / 2);
  const ypad = Math.ceil(size / 2);
  this.drawTile(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
export function drawTile(x, y, w, h, color) {
  const bounds = this.bounds;
  this.resizeByOffset(x, y);
  // resize a second time to update boundings to given w,h
  if (w > 1 || h > 1) {
    this.resizeByOffset(x + w - 1, y + h - 1);
  }
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    w, h
  );
};

/**
 * Fastest way to draw a tile
 * This method doesnt do auto resizing!
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
export function drawSilentTile(x, y, w, h, color) {
  const bounds = this.bounds;
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    w, h
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 */
export function clearAt(x, y, size) {
  const xpad = Math.floor(size / 2);
  const ypad = Math.floor(size / 2);
  this.clearRect(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
export function clearRect(x, y, w, h) {
  const batches = [];
  const bounds = this.bounds;
  const instance = this.instance;
  for (let ii = 0; ii < w * h; ++ii) {
    const xx = (ii % w) + x;
    const yy = ((ii / w) | 0) + y;
    const erased = this.eraseTileAt(xx, yy);
    for (let jj = 0; jj < erased.length; ++jj) {
      const batch = erased[jj];
      if (batches.indexOf(batch) <= -1) batches.push(batch);
    };
  };
  for (let ii = 0; ii < batches.length; ++ii) {
    batches[ii].refreshTexture();
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array} Returns changed batches
 */
export function eraseTileAt(x, y) {
  const batches = [];
  const pixels = this.instance.getPixelsAt(x, y).pixels;
  if (pixels.length) this.resizeByOffset(x, y);
  for (let ii = 0; ii < pixels.length; ++ii) {
    this.erased.push(pixels[ii]);
    const batch = pixels[ii].batch;
    const pixel = pixels[ii].pixel;
    const xx = x - batch.bounds.x;
    const yy = y - batch.bounds.y;
    // clear old batch
    batch.buffer.clearRect(
      xx, yy,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) batches.push(batch);
  };
  return (batches);
};
