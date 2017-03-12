import {
  WGL_SUPPORTED,
  MAGIC_RGB_A_BYTE
} from "./cfg";

/**
 * Returns unique integer
 * @return {Number}
 */
let uidx = 0;
export function uid() {
  return (++uidx);
};

/**
 * @param {Number} width
 * @param {Number} height
 * @return {CanvasRenderingContext2D}
 */
export function createCanvasBuffer(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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
  const img = new Image();
  img.addEventListener("load", () => {
    resolve(img);
  });
  img.addEventListener("error", () => {
    throw new Error("Failed to load image ressource " + path);
  });
  img.src = path;
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
 * Convert rgba to rgba byte color
 * @param {Array} rgba
 * @return {Array}
 */
export function rgbaToBytes(rgba) {
  const r = rgba[0] / 255;
  const g = rgba[1] / 255;
  const b = rgba[2] / 255;
  const a = rgba[3];
  return ([r, g, b, a]);
};

/**
 * @param {Array} color
 * @return {String}
 */
export function colorToRgbaString(color) {
  const r = color[0];
  const g = color[1];
  const b = color[2];
  const a = color[3];
  return (`rgba(${r},${g},${b},${a})`);
};

/**
 * @param {String} hex
 * @return {Array}
 */
export function hexToRgba(hex) {
  const r = parseInt(hex.substring(1,3), 16);
  const g = parseInt(hex.substring(3,5), 16);
  const b = parseInt(hex.substring(5,7), 16);
  return ([r, g, b, 1]);
};

/**
 * @param {Array} rgba
 * @return {String}
 */
export function rgbaToHex(rgba) {
  const r = rgba[0];
  const g = rgba[1];
  const b = rgba[2];
  const a = rgba[3];
  return (
    "#" +
    ("0" + parseInt(r, 10).toString(16)).slice(-2) +
    ("0" + parseInt(g, 10).toString(16)).slice(-2) +
    ("0" + parseInt(b, 10).toString(16)).slice(-2)
  );
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
 * Creates and returns an webgl context
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLRenderingContext}
 */
export function getWGLContext(canvas) {
  if (!WGL_SUPPORTED) {
    throw new Error("Your browser doesn't support WebGL.");
  }
  const opts = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    stencil: false,
    preserveDrawingBuffer: false
  };
  return (
    canvas.getContext("webgl", opts) ||
    canvas.getContext("experimental-webgl", opts)
  );
};
