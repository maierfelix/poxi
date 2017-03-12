/**
 * @param {Number} x
 * @param {Number} y
 */
export function selectFrom(x, y) {
  x = x | 0;
  y = y | 0;
  const relative = this.getRelativeTileOffset(x, y);
  this.sx = relative.x;
  this.sy = relative.y;
  this.sw = this.sh = 0;
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function selectTo(x, y) {
  x = x | 0;
  y = y | 0;
  const relative = this.getRelativeTileOffset(x, y);
  const w = relative.x - this.sx;
  const h = relative.y - this.sy;
  this.sw = w + (w >= 0 ? 1 : 0);
  this.sh = h + (h >= 0 ? 1 : 0);
};
