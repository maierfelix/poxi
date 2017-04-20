/**
 * @param {Batch} base
 * @param {Boolean} vertical
 */
export function flip(base, vertical) {
  const x = base.bounds.x;
  const y = base.bounds.y;
  const ww = base.bounds.w;
  const hh = base.bounds.h;
  base.data = base.data.reverse();
};
