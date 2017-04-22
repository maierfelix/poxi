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
    this.index = this.generateLayerNameIndex();
    this._name = "Layer " + this.index;
    // reference to ui node
    this.node = null;
    // reference (clone) to master layer
    this.reference = null;
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
 * @return {Layer}
 */
Layer.prototype.clone = function() {
  const layer = new Layer(this.instance);
  const batch = this.batch.clone();
  layer.last = Object.assign(layer.last);
  layer.opacity = this.opacity;
  layer.bounds = this.bounds.clone();
  layer.x = this.x; layer.y = this.y;
  layer.batch = batch;
  layer.batches.push(batch);
  // TODO: fix error below
  //layer.visible = this.visible;
  //layer.locked = this.locked;
  return (layer);
};

Layer.prototype.cloneByReference = function() {
  const layer = new Layer(this.instance);
  layer.last = Object.assign(layer.last);
  layer.opacity = this.opacity;
  layer.bounds = this.bounds;
  layer.x = this.x; layer.y = this.y;
  layer.batch = this.batch;
  layer.batches = this.batches;
  layer.reference = this;
  //layer.visible = this.visible;
  //layer.locked = this.locked;
  return (layer);
};

Layer.prototype.allocateLayerMatrix = function() {
  const instance = this.instance;
  this.batch = instance.createDynamicBatch(0, 0);
  // add reference to unused layer so we can use
  // the batch matrix logic for our layers too
  // but without including layer x,y in calculations
  this.batch.layer = instance.cache.layer;
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

/**
 * Auto generates a layer index name
 * and filles missing layer indices
 * @return {Number}
 */
Layer.prototype.generateLayerNameIndex = function() {
  const layers = this.instance.layers;
  // clone, take numeric index, sort ascending, es6 left its muck here
  const sorted = layers.concat().map((item) => item.index).sort((a, b) => a - b);
  for (let ii = 0; ii < sorted.length; ++ii) {
    if (sorted.indexOf(ii) < 0) return (ii);
  };
  return (layers.length);
};

/**
 * yuck in here, yuck in here
 */
Layer.prototype.addUiReference = function() {
  const tmpl = `
    <div class="layer-item">
      <img class="layer-item-visible" src="assets/img/visible.png">
      <img class="layer-item-locked" src="assets/img/unlocked.png">
      <input class="layer-text" value="${this.name}" readonly />
    </div>
  `;
  const parser = new DOMParser();
  const html = parser.parseFromString(tmpl, "text/html").querySelector(".layer-item");
  const index = this.getIndex();
  const layers = this.instance.layers;
  const ctx = window.layers;
  if (index >= ctx.children.length) {
    window.layers.appendChild(html);
  } else {
    window.layers.insertBefore(html, ctx.children[index]);
  }
  // save reference to inserted layer node
  this.node = html;
  this.locked = this.locked;
  this.visible = this.visible;
};

Layer.prototype.removeUiReference = function() {
  this.node.parentNode.removeChild(this.node);
  this.node = null;
};

extend(Layer, _matrix);

export default Layer;
