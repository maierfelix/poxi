import extend from "../extend";
import { uid } from "../utils";

import Batch from "../batch/index";
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
    this._name = "Layer " + this.instance.layers.length;
    // reference to ui node
    this.node = null;
    // opacity applied over local batches
    this.opacity = 255.0;
    // layer batch matrix
    this.batch = null;
    // batches we hold here
    this.batches = [];
    // relative boundings
    this.bounds = new Boundings();
    // layer states get/set base
    this._visible = true;
    this._locked = false;
    this.allocateLayerMatrix();
  }
  allocateLayerMatrix() {
    const instance = this.instance;
    this.batch = instance.createDynamicBatch(0, 0);
    // add reference to unused layer so we can use
    // the batch matrix logic for our layers too
    // but without including layer x,y in calculations
    this.batch.layer = instance.cache.layer;
  }
  addUiReference() {
    const tmpl = `
      <div class="layer-item">
        <img class="layer-item-visible" src="assets/img/visible.png">
        <img class="layer-item-locked" src="assets/img/unlocked.png">
        <input class="layer-text" value="${this.name}" readonly />
      </div>
    `;
    // 'afterbegin' equals array.unshift
    layers.insertAdjacentHTML("afterbegin", tmpl);
    // save reference to inserted layer node
    this.node = layers.children[0];
  }
  removeUiReference() {
    this.node.parentNode.removeChild(this.node);
    this.node = null;
  }
  /**
   * @return {String}
   */
  get name() {
    return (this._name);
  }
  /**
   * @param {String}
   */
  set name(value) {
    this._name = value;
    const node = this.node.querySelector(".layer-text");
    node.value = value;
  }
  /**
   * @return {Boolean}
   */
  get visible() {
    return (this._visible);
  }
  /**
   * @param {Boolean} state
   */
  set visible(state) {
    this._visible = state;
    this.instance.redraw = true;
    const node = this.node.querySelector(".layer-item-visible");
    node.src = state ? "assets/img/visible.png" : "assets/img/invisible.png";
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
    const node = this.node.querySelector(".layer-item-locked");
    node.src = state ? "assets/img/locked.png" : "assets/img/unlocked.png";
  }
};

/**
 * @return {Number}
 */
Layer.prototype.getIndex = function() {
  const layers = this.instance.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    if (this.id === layer.id) return (ii);
  };
  return (-1);
};

Layer.prototype.removeFromLayers = function() {
  const layers = this.instance.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    if (this.id === layer.id) layers.splice(ii, 1);
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
Layer.prototype.createBatchAt = function(x, y) {
  const dx = (x - this.x) | 0;
  const dy = (y - this.y) | 0;
  const batch = new Batch(this.instance);
  batch.prepareMatrix(dx, dy);
  this.addBatch(batch);
  return (batch);
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
