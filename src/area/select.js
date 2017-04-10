/**
 * @return {Object}
 */
export function getSelection() {
  // active shape selection
  if (this.shape !== null) {
    const bounds = this.shape.bounds;
    return ({
      shape: this.shape,
      x: bounds.x, y: bounds.y,
      w: bounds.w, h: bounds.h
    });
  }
  let x = this.sx; let y = this.sy;
  let w = this.sw; let h = this.sh;
  if (w < 0) x += w;
  if (h < 0) y += h;
  w = w < 0 ? -w : w;
  h = h < 0 ? -h : h;
  return ({
    shape: null,
    x: x, y: y,
    w: w, h: h
  });
};

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
  this.redraw = true;
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
  this.redraw = true;
};

export function resetSelection() {
  this.sx = this.sy = 0;
  this.sw = this.sh = -0;
  if (this.shape !== null) {
    this.destroyTexture(this.shape.texture);
    this.shape = null;
  }
  this.redraw = true;
};
