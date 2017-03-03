import {
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_SPEED,
  MAGIC_SCALE
} from "../cfg";

import { roundTo, zoomScale } from "../math";

/**
 * @class Camera
 */
class Camera {

  /**
   * @param {Poxi} instance
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
   * @param {Number} dir
   */
  scale(dir) {
    let x = (dir * (ZOOM_SPEED / 1e2)) * zoomScale(this.s);
    let oscale = this.s;
    if (this.s + x <= MIN_SCALE) this.s = MIN_SCALE;
    else if (this.s + x >= MAX_SCALE) this.s = MAX_SCALE;
    else this.s += x;
    this.s = roundTo(this.s, MAGIC_SCALE);
    this.x -= (this.lx) * (zoomScale(this.s) - zoomScale(oscale));
    this.y -= (this.ly) * (zoomScale(this.s) - zoomScale(oscale));
    this.instance.redraw();
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
    this.instance.redraw();
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
