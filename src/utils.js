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
