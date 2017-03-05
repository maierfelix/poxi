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
 * @param {String} path
 * @param {Function} resolve
 */
export function loadImage(path, resolve) {
  let img = new Image();
  img.addEventListener("load", () => {
    resolve(img);
  });
  img.addEventListener("error", () => {
    throw new Error("Failed to load image ressource " + path);
  });
  img.src = path;
};

/**
 * @param {String} path
 * @param {Function} resolve
 */
export function loadImageAsCanvas(path, resolve) {
  loadImage(path, (img) => {
    let width = img.width;
    let height = img.height;
    let buffer = createCanvasBuffer(width, height);
    buffer.drawImage(
      img,
      0, 0,
      width, height,
      0, 0,
      width, height
    );
    let view = buffer.canvas;
    resolve(view);
  });
};

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
export function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
};

/**
 * Derivative of alphaByteToRgbAlpha
 * @param {Number} a
 * @return {Number}
 */
export function rgbAlphaToAlphaByte(a) {
  return (Math.round((a / MAGIC_RGB_A_BYTE) * 10) / 10) | 0;
};

/**
 * @param {Array} color
 * @return {String}
 */
export function colorToRgbaString(color) {
  let r = color[0];
  let g = color[1];
  let b = color[2];
  let a = color[3];
  return (`rgba(${r},${g},${b},${a})`);
};

/**
 * @param {String} hex
 * @return {Array}
 */
export function hexToRgba(hex) {
  let r = parseInt(hex.substring(1,3), 16);
  let g = parseInt(hex.substring(3,5), 16);
  let b = parseInt(hex.substring(5,7), 16);
  return ([r,g,b,1]);
};

/**
 * @param {Array} rgba
 * @return {Number}
 */
export function rgbaToHex(rgba) {
  let r = rgba[0].toString(16);
  let g = rgba[1].toString(16);
  let b = rgba[2].toString(16);
  return parseInt(
    (r.length == 1 ? "0"+ r : r) +
    (g.length == 1 ? "0"+ g : g) +
    (b.length == 1 ? "0"+ b : b)
  , 16);
};

/**
 * Do rgba color arrays match
 * @param {Array} a
 * @param {Array} a
 * @return {Boolean}
 */
export function colorsMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
};

/**
 * Checks if a color array is fully transparent
 * @param {Array} color
 * @return {Boolean}
 */
const transparent = [0, 0, 0, 0];
export function isGhostColor(color) {
  return (colorsMatch(color, transparent));
};

/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
export function sortAscending(a, b) {
  return (a - b);
};

/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
export function sortDescending(a, b) {
  return (b - a);
};
