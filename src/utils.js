import { MAGIC_RGB_A_BYTE } from "./cfg";

/**
 * @param {Class} cls
 * @param {Array} prot
 */
export function inherit(cls, prot) {
  let key = null;
  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  };
}

/**
 * Returns a unique integer
 * @return {Number}
 */
let uidx = 0;
export function uid() {
  return (uidx++);
};

/**
 * String to hashcode like on our island java
 * @param {String} str
 * @return {Number}
 */
export function hashFromString(str) {
  let hash = 0;
  let length = str.length;
  for (let ii = 0; ii < length; ++ii) {
    let ch = str.charCodeAt(ii);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return (hash);
};

/**
 * @param {Number} width
 * @param {Number} height
 * @return {CanvasRenderingContext2D}
 */
export function createCanvasBuffer(width, height) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext("2d");
  applyImageSmoothing(ctx, false);
  return (ctx);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Boolean} state
 */
export function applyImageSmoothing(ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
};

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
export function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
};