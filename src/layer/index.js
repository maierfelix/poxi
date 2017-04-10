import { uid } from "../utils";
import { MAX_SAFE_INTEGER } from "../cfg";

import Boundings from "../bounds/index";

/**
 * @class {Layer}
 */
class Layer {
  /**
   * @constructor
   */
  constructor() {
    this.id = uid();
    // position
    this.x = 0;
    this.y = 0;
    // we can name layers
    this.name = null;
    // opacity applied over local batches
    this.opacity = 255.0;
    // buffered texture of all our local batches
    this.buffer = null;
    // batches we hold here
    this.batches = [];
    // relative boundings
    this.bounds = new Boundings();
    // different layer states
    this.states = {
      hidden: false,
      locked: false
    };
  }
};

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer.prototype.addBatch = function(batch) {
  batch.layer = this;
  this.batches.push(batch);
  this.updateBoundings();
};

/**
 * @param {Number} id
 * @return {Number}
 */
Layer.prototype.getBatchById = function(id) {
  let result = null;
  const batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    if (batch.id === id) {
      result = batch;
      break;
    }
  };
  return (result);
};

Layer.prototype.updateBoundings = function() {
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  const batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    const bx = bounds.x; const by = bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // ignore empty batches
    if (bounds.w === 0 && bounds.h === 0) continue;
    // calculate x
    if (x < 0 && bx < x) x = bx;
    else if (x >= 0 && (bx < 0 || bx < x)) x = bx;
    // calculate y
    if (y < 0 && by < y) y = by;
    else if (y >= 0 && (by < 0 || by < y)) y = by;
    // calculate width
    if (bw > w) w = bw;
    // calculate height
    if (bh > h) h = bh;
  };
  // update our boundings
  this.bounds.update(x, y, -x + w, -y + h);
};

export default Layer;
