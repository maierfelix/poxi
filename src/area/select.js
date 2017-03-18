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
  let w = relative.x - this.sx;
  let h = relative.y - this.sy;
  w = w + (w >= 0 ? 1 : 0);
  h = h + (h >= 0 ? 1 : 0);
  this.sw = w;
  this.sh = h;
};

export function resetSelection() {
  this.sx = this.sy = 0;
  this.sw = this.sh = -0;
};
