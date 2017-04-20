import { intersectRectangles } from "../math";

/**
 * @class Boundings
 */
class Boundings {
  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Number} w
   * @param {Number} h
   */
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.update(x, y, w, h);
  };
};

/**
 * @return {Boundings}
 */
Boundings.prototype.clone = function() {
  const bounds = new Boundings(
    this.x, this.y, this.w, this.h
  );
  return (bounds);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
Boundings.prototype.update = function(x, y, w, h) {
  x = x | 0;
  y = y | 0;
  w = w | 0;
  h = h | 0;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
Boundings.prototype.isPointInside = function(x, y) {
  x = x | 0;
  y = y | 0;
  const state = intersectRectangles(
    this.x, this.y, this.w - 1, this.h - 1,
    x, y, 0, 0
  );
  return (state);
};

export default Boundings;
