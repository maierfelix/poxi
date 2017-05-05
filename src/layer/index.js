import extend from "../extend";
import {
  uid,
  createCanvasBuffer
} from "../utils";
import { getRainbowColor } from "../color";

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
    // references layers inference colors
    this.color = { value: null };
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
    this._opacity = 1.0;
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
   * @return {Number}
   */
  get opacity() {
    return (this._opacity);
  }
  /**
   * @param {Number}
   */
  set opacity(value) {
    this._opacity = value;
    this.instance.redraw = true;
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
  /**
   * Returns if layer is active
   * @return {Boolean}
   */
  get isActive() {
    const current = this.instance.getCurrentLayer();
    return (current === this);
  }
  /**
   * Indicates if layer is a reference (absolute or referenced)
   * @return {Boolean}
   */
  get isReference() {
    return (
      (this.getReferencedLayers().length > 0 || this.reference !== null)
    );
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
  layer._visible = this.visible;
  layer._locked = this.locked;
  return (layer);
};

Layer.prototype.cloneByReference = function() {
  if (this.color.value === null) {
    this.color.value = getRainbowColor();
    this.removeUiReference();
    this.addUiReference();
  }
  const layer = new Layer(this.instance);
  layer.last = Object.assign(layer.last);
  layer.opacity = this.opacity;
  layer.bounds = this.bounds;
  layer.x = this.x; layer.y = this.y;
  layer.batch = this.batch;
  layer.batches = this.batches;
  //layer.reference = this.reference || this;
  layer.reference = this;
  layer.color = this.color;
  layer._visible = this.visible;
  layer._locked = this.locked;
  return (layer);
};

/**
 * Walks through referenced layers until
 * the absolute layer reference is found
 * @return {Layer}
 */
Layer.prototype.getAbsoluteReference = function() {
  let layer = this.reference;
  while (true) {
    if (layer.reference === null) {
      return (layer);
    }
    layer = layer.reference;
  };
  return (null);
};

/**
 * @return {Array}
 */
Layer.prototype.getReferencedLayers = function() {
  const layers = this.instance.layers;
  const references = [];
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    if (layer === this) continue;
    if (layer.reference !== null) {
      if (layer.reference === this) references.push(layer);
    }
  };
  return (references);
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

/**
 * @return {Boolean}
 */
Layer.prototype.isEmpty = function() {
  return (this.batch.isEmpty());
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
 * Returns the layer position
 * relative to our stage
 * @return {Object}
 */
Layer.prototype.getRelativePosition = function() {
  const sx = this.instance.bounds.x;
  const sy = this.instance.bounds.y;
  const x = (this.x + this.bounds.x) - sx;
  const y = (this.y + this.bounds.y) - sy;
  return ({ x, y });
};

/**
 * Fill imagedata with pixels then
 * put it into a canvas and return it
 * @return {CanvasRenderingContext2D}
 */
Layer.prototype.toCanvasBuffer = function() {
  // TODO: also draw batch[n].forceRendering for live previews
  const data = this.batch.data;
  const lw = this.bounds.w | 0;
  const lh = this.bounds.h | 0;
  const buffer = createCanvasBuffer(lw, lh);
  // prevent imagedata construction from failing
  if (lw <= 0 || lh <= 0) return (buffer);
  const img = new ImageData(lw, lh);
  const idata = img.data;
  for (let ii = 0; ii < data.length; ii += 4) {
    const alpha = data[ii + 3] | 0;
    if (alpha <= 0) continue;
    idata[ii + 0] = data[ii + 0] | 0;
    idata[ii + 1] = data[ii + 1] | 0;
    idata[ii + 2] = data[ii + 2] | 0;
    idata[ii + 3] = alpha;
  };
  buffer.putImageData(img, 0, 0);
  return (buffer);
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
 * Returns the string version of the dom node
 * @return {String}
 */
Layer.prototype.generateUiNode = function() {
  const html = `
    <div class="layer-item">
      <img class="layer-item-visible" src="assets/img/visible.png">
      <img class="layer-item-locked" src="assets/img/unlocked.png">
      <input class="layer-text" value="${this.name}" readonly />
    </div>
  `;
  return (html);
};

/**
 * Returns color of the layer node
 * @return {String}
 */
Layer.prototype.getUiNodeColor = function() {
  // only attach color to layer if
  // layer is a absolute reference or is a reference
  const count = this.isReference;
  const cc = this.color.value;
  const color = (
    cc && count ? `rgba(${cc[0]},${cc[1]},${cc[2]},0.1)` : ""
  );
  return (color);
};

/**
 * yuck in here, yuck in here
 */
Layer.prototype.addUiReference = function() {
  const tmpl = this.generateUiNode();
  const parser = new DOMParser();
  const html = parser.parseFromString(tmpl, "text/html").querySelector(".layer-item");
  const index = this.getIndex();
  const ctx = window.layers;
  if (index >= ctx.children.length) {
    ctx.appendChild(html);
  } else {
    ctx.insertBefore(html, ctx.children[index]);
  }
  // save reference to inserted layer node
  this.node = html;
  html.style.backgroundColor = this.getUiNodeColor();
  if (this.isActive) {
    this.instance.setActiveLayer(this);
  }
  this.locked = this.locked;
  this.visible = this.visible;
};

Layer.prototype.removeUiReference = function() {
  this.node.parentNode.removeChild(this.node);
  this.node = null;
};

extend(Layer, _matrix);

export default Layer;
