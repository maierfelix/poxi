import { MAGIC_RGB_A_BYTE } from "./cfg";

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
export function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
};

/**
 * 0-1 => 0-255
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
 * Convert bytes to rgba color
 * @param {Array} bytes
 * @return {Array}
 */
export function bytesToRgba(bytes) {
  const r = bytes[0] * 255;
  const g = bytes[1] * 255;
  const b = bytes[2] * 255;
  const a = bytes[3];
  return ([r, g, b, a]);
};

/**
 * @param {Uint8Array} aa
 * @param {Uint8Array} bb
 * @param {Boolean} state
 * @return {Int16Array}
 */
export function rgbaDifference(aa, bb, state) {
  const rgba = new Int16Array(4);
  const way = state ? 1 : -1;
  rgba[0] = aa[0] + bb[0] * way;
  rgba[1] = aa[1] + bb[1] * way;
  rgba[2] = aa[2] + bb[2] * way;
  rgba[3] = aa[3] + bb[3] * way;
  return (rgba);
};

/**
 * Additive color blending with alpha support
 * @param {Uint8Array} src
 * @param {Uint8Array} dst
 * @return {Uint8Array}
 */
export function additiveAlphaColorBlending(src, dst) {
  const a1 = ((src[3] * MAGIC_RGB_A_BYTE) * 10) / 10;
  const a2 = ((dst[3] * MAGIC_RGB_A_BYTE) * 10) / 10;
  const a = 1 - (1 - a2) * (1 - a1);
  const r = ((dst[0] * a2 / a) + (src[0] * a1 * (1 - a2) / a)) | 0;
  const g = ((dst[1] * a2 / a) + (src[1] * a1 * (1 - a2) / a)) | 0;
  const b = ((dst[2] * a2 / a) + (src[2] * a1 * (1 - a2) / a)) | 0;
  src[0] = r;
  src[1] = g;
  src[2] = b;
  src[3] = ((a / MAGIC_RGB_A_BYTE) * 10) / 10;
  return (src);
};

/**
 * @return {Array}
 */
export function randomRgbaColor() {
  const r = (Math.random() * 256) | 0;
  const g = (Math.random() * 256) | 0;
  const b = (Math.random() * 256) | 0;
  return ([r, g, b, 1]);
};

let velo = 12;
let rr = 127; let rrr = 1;
let rg = 12; let rrg = 1;
let rb = 108; let rrb = 1;
export function getRainbowColor() {
  rr += rrr;
  if (rr >= 255) rrr = -velo;
  else if (rr <= 0) rrr = velo;
  rg += rrg;
  if (rg >= 255) rrg = -velo;
  else if (rg <= 0) rrg = velo;
  rb += rrb;
  if (rb >= 255) rrb = -velo;
  else if (rb <= 0) rrb = velo;
  return ([rr, rg, rb, velo]);
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
