import { MAX_SAFE_INTEGER } from "../cfg";

import {
  uid,
  createCanvasBuffer
} from "../utils";

import { colorToRgbaString } from "../color";

import extend from "../extend";

import Boundings from "../bounds/index";

import * as _tile from "./tile";
import * as _matrix from "./matrix";

import * as _blend from "./filter/blend";
import * as _invert from "./filter/invert";
import * as _onion from "./filter/onion";
import * as _replace from "./filter/replace";
import * as _shading from "./filter/shading";
import * as _smoothing from "./filter/smoothing";

/**
 * @class Batch
 */
class Batch {
  /**
   * @param {Poxi} instance
   * @constructor
   */
  constructor(instance) {
    this.id = uid();
    // save reference to layer
    this.layer = null;
    this.instance = instance;
    // data related
    this.data = null;
    this.reverse = null;
    // buffer related
    // used for canvas batches
    this.buffer = null;
    // wgl texture
    this.texture = null;
    // relative boundings
    this.bounds = new Boundings();
    // we use this batch for erasing
    this.isEraser = false;
    // we use this batch for moving
    this.isMover = false;
    this.position = { x: 0, y: 0, mx: 0, my: 0 };
    // indicates if we should force to render this batch
    // even when it is not registered inside our stack yet
    this.forceRendering = false;
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.move = function(x, y) {
  const xx = x - this.position.mx;
  const yy = y - this.position.my;
  this.position.x += xx;
  this.position.y += yy;
  this.layer.x += xx;
  this.layer.y += yy;
  this.position.mx = x;
  this.position.my = y;
};

/**
 * @return {Number}
 */
Batch.prototype.getStackIndex = function() {
  const id = this.id;
  const commands = this.instance.stack;
  for (let ii = 0; ii < commands.length; ++ii) {
    const cmd = commands[ii];
    if (cmd.batch.id === id) return (ii);
  };
  return (-1);
};

Batch.prototype.kill = function() {
  const id = this.id;
  const instance = this.instance;
  const layers = instance.layers;
  // free batch from memory
  this.bounds = null;
  this.buffer = null;
  this.data = null;
  this.reverse = null;
  this.instance.destroyTexture(this.texture);
  // finally remove batch from layer
  let count = 0;
  for (let ii = 0; ii < layers.length; ++ii) {
    const batches = layers[ii].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      if (batch.id === id) {
        batches.splice(jj, 1);
        layers[ii].updateBoundings();
        count++;
      }
    };
  };
  if (count <= 0 && !this.isMover) {
    throw new Error(`Failed to kill batch:${this.id}`);
  }
};

/**
 * @param {Boolean} state
 */
Batch.prototype.refreshTexture = function(resized) {
  const bounds = this.bounds;
  const bw = bounds.w; const bh = bounds.h;
  const instance = this.instance;
  if (resized) {
    // free old texture from memory
    if (this.texture !== null) {
      instance.destroyTexture(this.texture);
    }
    this.texture = instance.bufferTexture(this.id, this.data, bw, bh);
  } else {
    instance.updateTexture(this.texture, this.data, bw, bh);
  }
  // trigger our stage to get redrawn
  this.instance.redraw = true;
};

extend(Batch, _tile);
extend(Batch, _matrix);

extend(Batch, _blend);
extend(Batch, _invert);
extend(Batch, _onion);
extend(Batch, _replace);
extend(Batch, _shading);
extend(Batch, _smoothing);

export default Batch;
