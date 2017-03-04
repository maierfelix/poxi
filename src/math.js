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
  let i = 1 / t;
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
  let x = Math.max(x1, x2);
  let w = Math.min(x1 + w1, x2 + w2);
  let y = Math.max(y1, y2);
  let h = Math.min(y1 + h1, y2 + h2);
  return (w >= x && h >= y);
};
