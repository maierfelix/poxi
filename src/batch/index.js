import { MAX_SAFE_INTEGER } from "../cfg";

import {
  uid,
  createCanvasBuffer
} from "../utils";

import { colorToRgbaString } from "../color";

import extend from "../extend";

import Boundings from "../bounds/index";

import * as _raw from "./raw";
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
    this.buffer = null;
    this.texture = null;
    // relative boundings
    this.bounds = new Boundings();
    // we use this batch for erasing
    this.isEraser = false;
    // indicates if we should force to render this batch
    // even when it is not registered inside our stack yet
    this.forceRendering = false;
  }
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
  for (let ii = 0; ii < layers.length; ++ii) {
    const batches = layers[ii].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      if (batch.id === id) {
        // free from memory
        batch.bounds = null;
        batch.buffer = null;
        batch.data = null;
        batch.reverse = null;
        batch.instance.destroyTexture(batch.texture);
        batches.splice(jj, 1);
        layers[ii].updateBoundings();
        break;
      }
    };
  };
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.prepareMatrix = function(x, y) {
  const bounds = this.bounds;
  // we don't have a buffer to store data at yet
  if (this.data === null) {
    bounds.x = x;
    bounds.y = y;
    bounds.w = 1;
    bounds.h = 1;
    const size = 4 * (bounds.w * bounds.h);
    this.data = new Uint8Array(size);
    this.reverse = new Uint8Array(size);
    this.texture = this.instance.bufferTexture(this.id, this.data, bounds.w, bounds.h);
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

/**
 * *We expect that the batch is single colored*
 * @return {Uint8Array}
 */
Batch.prototype.getBatchColor = function() {
  const data = this.data;
  const bounds = this.bounds;
  const bw = bounds.w; const bh = bounds.h;
  const color = new Uint8Array(4);
  // calculate batch color
  for (let ii = 0; ii < bw * bh; ++ii) {
    const xx = ii % bw;
    const yy = (ii / bw) | 0;
    const px = 4 * (yy * bw + xx);
    if (data[px + 3] <= 0) continue;
    color[0] = data[px + 0];
    color[1] = data[px + 1];
    color[2] = data[px + 2];
    color[3] = data[px + 3];
    break;
  };
  return (color);
};

Batch.prototype.clear = function() {
  const data = this.data;
  for (let ii = 0; ii < data.length; ++ii) {
    data[ii] = 0;
  };
};

/**
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  const data = this.data;
  const bw = this.bounds.w;
  let count = 0;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    const a = data[px + 3];
    // ignore empty tiles
    if (a <= 0) continue;
    count++;
  };
  return (count <= 0);
};

extend(Batch, _raw);
extend(Batch, _tile);
extend(Batch, _matrix);

extend(Batch, _blend);
extend(Batch, _invert);
extend(Batch, _onion);
extend(Batch, _replace);
extend(Batch, _shading);
extend(Batch, _smoothing);

export default Batch;
