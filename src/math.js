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