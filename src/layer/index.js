import extend from "../extend";
import { uid } from "../utils";

import Boundings from "../bounds/index";

import * as _matrix from "./matrix";

/**
 * @class {Layer}
 */
class Layer {
  /**
   * @param {Poxi} instance
   * @constructor
   */
  constructor(instance) {
    this.id = uid();
    this.instance = instance;
    // position
    this.x = 0;
    this.y = 0;
    // last boundings
    this.last = { x: 0, y: 0, w: 0, h: 0 };
    // we can name layers
    this.name = null;
    // opacity applied over local batches
    this.opacity = 255.0;
    // layer batch matrix
    this.batch = instance.createDynamicBatch(0, 0);
    // batches we hold here
    this.batches = [];
    // relative boundings
    this.bounds = new Boundings();
    // layer states get/set base
    this._hidden = false;
    this._locked = false;
  }
  /**
   * @return {Boolean}
   */
  get hidden() {
    return (this._hidden);
  }
  /**
   * @param {Boolean} state
   */
  set hidden(state) {
    this._hidden = state;
    this.instance.redraw = true;
  }
  /**
   * @return {Boolean}
   */
  get locked() {
    return (this._locked);
  }
  /**
   * @param {Boolean} state
   */
  set locked(state) {
    this._locked = state;
    this.instance.redraw = true;
  }
};

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer.prototype.addBatch = function(batch) {
  batch.layer = this;
  this.batches.push(batch);
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

extend(Layer, _matrix);

export default Layer;
