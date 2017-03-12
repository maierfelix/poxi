/**
 * @param {Number} x
 * @return {Number}
 */
export function zoomScale(x) {
  return (
    x >= 0 ? x + 1 :
    x < 0 ? x + 1 :
    x + 1
  );
}

/**
 * @param {Number} x
 * @param {Number} t
 * @return {Number}
 */
export function roundTo(x, t) {
  const i = 1 / t;
  return (Math.round(x * i) / i);
};

/**
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} w1
 * @param {Number} h1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Number} w2
 * @param {Number} h2
 * @return {Boolean}
 */
export function intersectRectangles(x1, y1, w1, h1, x2, y2, w2, h2) {
  x1 = x1 | 0; y1 = y1 | 0;
  w1 = w1 | 0; h1 = h1 | 0;
  x2 = x2 | 0; y2 = y2 | 0;
  w2 = w2 | 0; h2 = h2 | 0;
  const xx = Math.max(x1, x2);
  const ww = Math.min(x1 + w1, x2 + w2);
  const yy = Math.max(y1, y2);
  const hh = Math.min(y1 + h1, y2 + h2);
  return (ww >= xx && hh >= yy);
};
