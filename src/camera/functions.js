import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_SPEED,
  MAGIC_SCALE
} from "../cfg";

import {
  roundTo,
  zoomScale,
  alignToGrid
} from "../math";

/**
 * @param {Number} dir
 */
export function scale(dir) {
  const x = (dir * (ZOOM_SPEED / 1e2)) * zoomScale(this.cs);
  const oscale = this.cs;
  if (this.cs + x <= MIN_SCALE) this.cs = MIN_SCALE;
  else if (this.cs + x >= MAX_SCALE) this.cs = MAX_SCALE;
  else this.cs += x;
  this.cs = roundTo(this.cs, MAGIC_SCALE);
  if (this.cs >= (MAX_SCALE - 1) + .25) this.cs = (MAX_SCALE - 1) + .25;
  this.cx -= (this.lx) * (zoomScale(this.cs) - zoomScale(oscale));
  this.cy -= (this.ly) * (zoomScale(this.cs) - zoomScale(oscale));
  this.cr = roundTo(this.cs, MAGIC_SCALE);
  this.updateGrid();
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function click(x, y) {
  x = x | 0;
  y = y | 0;
  const position = this.getRelativeOffset(x, y);
  this.dx = x;
  this.dy = y;
  this.lx = position.x;
  this.ly = position.y;
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function hover(x, y) {
  x = x | 0;
  y = y | 0;
  this.mx = x;
  this.my = y;
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function drag(x, y) {
  x = x | 0;
  y = y | 0;
  this.cx += x - this.dx;
  this.cy += y - this.dy;
  this.dx = x;
  this.dy = y;
  this.updateGrid();
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getRelativeOffset(x, y) {
  x = x | 0;
  y = y | 0;
  const xx = (x - this.cx) / this.cs;
  const yy = (y - this.cy) / this.cs;
  return ({
    x: xx,
    y: yy
  });
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getRelativeTileOffset(x, y) {
  x = x | 0;
  y = y | 0;
  const rel = this.getRelativeOffset(x, y);
  return (
    this.getTileOffsetAt(rel.x, rel.y)
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getTileOffsetAt(x, y) {
  x = x | 0;  
  y = y | 0;
  const half = TILE_SIZE / 2;
  const xx = alignToGrid(x - half);
  const yy = alignToGrid(y - half);
  return ({
    x: (xx / TILE_SIZE) | 0,
    y: (yy / TILE_SIZE) | 0
  });
};

/**
 * @param {Boundings} bounds 
 */
export function boundsInsideView(bounds) {
  const cs = this.cs;
  const ww = (bounds.w * TILE_SIZE) * cs;
  const hh = (bounds.h * TILE_SIZE) * cs;
  const xx = ((bounds.x * TILE_SIZE) * cs) + this.cx;
  const yy = ((bounds.y * TILE_SIZE) * cs) + this.cy;
  return (
    (xx + ww >= 0 && xx <= this.cw) &&
    (yy + hh >= 0 && yy <= this.ch)
  );
};
