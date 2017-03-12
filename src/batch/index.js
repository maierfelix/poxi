import {
  uid,
  createCanvasBuffer
} from "../utils";

import extend from "../extend";

import Boundings from "../bounds/index";

import * as _raw from "./raw";
import * as _boundings from "./boundings";

/**
 * @class Batch
 */
class Batch {
  constructor() {
    this.id = uid();
    // buffer related
    this.buffer = null;
    this.isBuffered = false;
    // relative boundings
    this.bounds = new Boundings();
    // background related
    this.color = null;
    this.isBackground = false;
    // if we only have raw data
    this.isRawBuffer = false;
    this.erased = [];
  }
};

/**
 * Batch is completely empty
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  return (
    !this.isBuffered &&
    !this.isRawBuffer &&
    !this.isBackground
  );
};

/**
 * Get color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getColorAt = function(x, y) {
  // nothing buffered
  if (this.isEmpty()) return (null);
  // use image data for raw buffers
  if (this.isRawBuffer) {
    const color = this.getRawColorAt(x, y);
    if (color !== null) return (color);
  }
  // return background color if batch is a filled background
  if (this.isBackground) return (this.color);
  // wat is going on
  return (null);
};

extend(Batch, _raw);
extend(Batch, _boundings);

export default Batch;
