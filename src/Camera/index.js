import {
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_SPEED
} from "../cfg";

import { roundTo, zoomScale } from "../math";

/**
 * @class Camera
 */
class Camera {

  /**
   * @param {Picaxo} instance
   */
  constructor(instance) {
    this.x = 0;
    this.y = 0;
    this.s = MIN_SCALE + 6;
    this.dx = 0;
    this.dy = 0;
    this.lx = 0;
    this.ly = 0;
    this.width = 0;
    this.height = 0;
    this.instance = instance;
  }

  /**
   * @param {Number} x
   */
  scale(x) {
    x = (x * ZOOM_SPEED) / (Math.hypot(this.width, this.height) / 2) * zoomScale(this.s);
    let oscale = this.s;
    if (this.s + x <= MIN_SCALE) this.s = MIN_SCALE;
    else if (this.s + x >= MAX_SCALE) this.s = MAX_SCALE;
    else this.s += x;
    this.s = roundTo(this.s, .125);
    this.x -= (this.lx) * (zoomScale(this.s) - zoomScale(oscale));
    this.y -= (this.ly) * (zoomScale(this.s) - zoomScale(oscale));
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  click(x, y) {
    let position = this.getRelativeOffset(x, y);
    this.dx = x;
    this.dy = y;
    this.lx = position.x;
    this.ly = position.y;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  drag(x, y) {
    this.x += x - this.dx;
    this.y += y - this.dy;
    this.dx = x;
    this.dy = y;
    // smooth dragging
    this.instance.clear();
    this.instance.render();
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  getRelativeOffset(x, y) {
    let xx = (x - this.x) / this.s;
    let yy = (y - this.y) / this.s;
    return ({
      x: xx,
      y: yy
    });
  }

  /**
   * @param {Number} width
   * @param {Number} height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

};

export default Camera;
