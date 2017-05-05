import { TILE_SIZE } from "../cfg";
import {
  uid,
  createCanvasBuffer
} from "../utils";

import { intersectRectangles } from "../math";

import {
  colorToRgbaString,
  rgbAlphaToAlphaByte
} from "../color";

import extend from "../extend";
import Layer from "../layer/index";
import Boundings from "../bounds/index";

/**
 * @class Container
 * @extends Layer
 */
class Container extends Layer {
  /**
   * @param {Poxi} instance
   * @constructor
   */
  constructor(instance) {
    super(instance);
    this.animation = {
      w: 32, h: 32,
      frame: 0, speed: 0
    };
    // tile amount x
    this.bounds.w = 3;
    // tile amount y
    this.bounds.h = 4;
  }
};

/**
 * @param {Number} index
 * @return {CanvasRenderingContext2D}
 */
Container.prototype.getFrameData = function(index) {
  const instance = this.instance;
  const animation = this.animation;
  const fw = animation.w; const fh = animation.h;
  const fx = this.bounds.x + (fw * ((index % this.bounds.w) | 0));
  const fy = this.bounds.y + (fh * ((index / this.bounds.w) | 0));
  const layers = this.instance.layers;
  const size = fw * fh;
  const buffer = createCanvasBuffer(fw, fh);
  for (let ii = 0; ii < size; ++ii) {
    const xx = (ii % fw) | 0;
    const yy = (ii / fw) | 0;
    const pixel = instance.getAbsolutePixelAt(fx + xx, fy + yy);
    if (pixel === null) continue;
    buffer.fillStyle = colorToRgbaString(pixel);
    buffer.fillRect(xx, yy, 1, 1);
  };
  return (buffer);
};

/**
 * @return {CanvasRenderingContext2D}
 */
Container.prototype.getAnimationTemplate = function() {
  const instance = this.instance;
  const animation = this.animation;
  const fw = animation.w; const fh = animation.h;
  const fx = this.bounds.x - fw;
  const fy = this.bounds.y;
  const layers = this.instance.layers;
  const size = fw * fh;
  const buffer = createCanvasBuffer(fw, fh);
  for (let ii = 0; ii < size; ++ii) {
    const xx = (ii % fw) | 0;
    const yy = (ii / fw) | 0;
    const pixel = instance.getAbsolutePixelAt(fx + xx, fy + yy);
    if (pixel === null) continue;
    buffer.fillStyle = colorToRgbaString(pixel);
    buffer.fillRect(xx, yy, 1, 1);
  };
  return (buffer);
};

Container.prototype.renderAnimationPreview = function() {
  const instance = this.instance;
  const cx = instance.cx | 0;
  const cy = instance.cy | 0;
  const cr = instance.cr;
  const buffer = instance.cache.fg;
  const animation = this.animation;
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  const tilew = ((animation.w * TILE_SIZE) * cr) | 0;
  const tileh = ((animation.h * TILE_SIZE) * cr) | 0;
  const ww = (((bw * animation.w) * TILE_SIZE) * cr) | 0;
  const hh = (((bh * animation.h) * TILE_SIZE) * cr) | 0;
  const xx = (cx + (this.bounds.x * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.bounds.y * TILE_SIZE) * cr) | 0;
  const ctx = this.getFrameData(animation.frame);
  const canvas = ctx.canvas;
  // draw preview border
  const preview = this.getAnimationTemplate();
  buffer.globalAlpha = 0.25;
  const size = ((bw * bh) * animation.w);
  for (let ii = 0; ii < size; ii += animation.w) {
    const px = (ii % bw) | 0;
    const py = ((ii / bw) / animation.w) | 0;
    buffer.drawImage(
      preview.canvas,
      0, 0,
      animation.w, animation.h,
      xx + (px * tilew), yy + (py * tileh),
      tilew, tileh
    );
  };
  buffer.globalAlpha = 1.0;
};

Container.prototype.renderFrame = function() {
  const instance = this.instance;
  const cx = instance.cx | 0;
  const cy = instance.cy | 0;
  const cr = instance.cr;
  const buffer = instance.cache.fg;
  const animation = this.animation;
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  const tilew = ((animation.w * TILE_SIZE) * cr) | 0;
  const tileh = ((animation.h * TILE_SIZE) * cr) | 0;
  const ww = (((bw * animation.w) * TILE_SIZE) * cr) | 0;
  const hh = (((bh * animation.h) * TILE_SIZE) * cr) | 0;
  const xx = (cx + (this.bounds.x * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.bounds.y * TILE_SIZE) * cr) | 0;
  const ax = xx - tilew | 0;
  const ay = yy | 0;
  const ctx = this.getFrameData(animation.frame);
  const canvas = ctx.canvas;
  buffer.drawImage(
    canvas,
    0, 0,
    canvas.width | 0, canvas.height | 0,
    ax | 0, ay | 0,
    tilew | 0, tileh | 0
  );
};

Container.prototype.renderBoundings = function() {
  const instance = this.instance;
  const cx = instance.cx | 0;
  const cy = instance.cy | 0;
  const cr = instance.cr;
  const buffer = instance.cache.fg;
  const lw = Math.max(0.55, 0.55 * cr);
  const animation = this.animation;
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  const tilew = ((animation.w * TILE_SIZE) * cr) | 0;
  const tileh = ((animation.h * TILE_SIZE) * cr) | 0;
  const ww = (((bw * animation.w) * TILE_SIZE) * cr) | 0;
  const hh = (((bh * animation.h) * TILE_SIZE) * cr) | 0;
  const xx = (cx + (this.bounds.x * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.bounds.y * TILE_SIZE) * cr) | 0;
  const ax = xx - tilew | 0;
  const ay = yy | 0;
  // draw grid
  buffer.strokeStyle = "rgba(255,255,255,0.375)";
  buffer.lineWidth = lw;
  buffer.beginPath();
  for (let ii = tilew; ii < ww; ii += tilew) {
    buffer.moveTo(xx + ii, yy);
    buffer.lineTo(xx + ii, yy + hh);
  };
  for (let ii = tileh; ii < hh; ii += tileh) {
    buffer.moveTo(xx, yy + ii);
    buffer.lineTo(xx + ww, yy + ii);
  };
  buffer.stroke();
  buffer.closePath();
  // draw border
  instance.drawStrokedRect(xx, yy, ww, hh, "rgba(255,255,255,0.375)");
  instance.drawRectangle(ax, ay, tilew - lw, tileh, [1,1,1,0.1]);
  instance.drawStrokedRect(ax, ay, tilew - lw, tileh, "rgba(255,255,255,0.375)");
};

export default Container;
