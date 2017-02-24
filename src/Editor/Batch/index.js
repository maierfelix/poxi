import {
  TILE_SIZE,
  BATCH_BUFFER_SIZE
} from "../../cfg";

import {
  createCanvasBuffer,
  alphaByteToRgbAlpha
} from "../../utils";

import Texture from "./Texture/index";

/**
 * @class Batch
 */
class Batch {
  constructor() {
    this.tiles = [];
    this.buffer = null;
    this.isBuffered = false;
    /**
     * This property indicates, if only
     * the canvas buffer is available to us
     * e.g. used for inserted sprite images
     */
    this.isRawBuffer = false;
  }
};

/**
 * Calculate cropped size of given batch
 * @return {Object}
 */
Batch.prototype.getBoundings = function() {
  // start position at maximum buffer size
  let x = BATCH_BUFFER_SIZE.MAX_W;
  let y = BATCH_BUFFER_SIZE.MAX_H;
  let px = [];
  let py = [];
  let tiles = this.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    px.push(tile.x);
    py.push(tile.y);
  };
  px.sort((a, b) => { return a - b; });
  py.sort((a, b) => { return a - b; });
  let idx = px.length-1;
  // calculate rectangle position
  let xx = (px[0] / TILE_SIZE) | 0;
  let yy = (py[0] / TILE_SIZE) | 0;
  // calculate rectangle size
  let ww = (((px[idx] - px[0]) / TILE_SIZE) | 0) + 1;
  let hh = (((py[idx] - py[0]) / TILE_SIZE) | 0) + 1;
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
};

/**
 * Creates a cropped canvas buffer
 */
Batch.prototype.renderBuffer = function() {
  let info = this.getBoundings();
  let buffer = createCanvasBuffer(info.w, info.h);
  buffer.clearRect(0, 0, info.w, info.h);
  let ww = info.w;
  let bx = info.x;
  let by = info.y;
  let tiles = this.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let color = tile.colors[tile.cindex];
    let xx = (tile.x / TILE_SIZE) - bx;
    let yy = (tile.y / TILE_SIZE) - by;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  };
  this.buffer = new Texture(buffer, bx, by);
  this.isBuffered = true;
};

/**
 * Determine if we should buffer the batch or not
 * Buffering a batch makes only sense on a given minimum size,
 * because fillRect (tile based) is much faster than drawImage (buffered)
 * @return {Boolean}
 */
Batch.prototype.exceedsBounds = function() {
  if (this.tiles.length >= BATCH_BUFFER_SIZE.MIN_L) return (true);
  let size = this.getBoundings();
  return (
    size.w - 1 >= BATCH_BUFFER_SIZE.MIN_W ||
    size.h - 1 >= BATCH_BUFFER_SIZE.MIN_H
  );
};

/**
 * Get tile color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getTileColorAt = function(x, y) {
  if (!this.isBuffered) return ([0,0,0,0]);
  let data = this.buffer.context.getImageData(x, y, 1, 1).data;
  let alpha = alphaByteToRgbAlpha(data[3]);
  let color = [data[0], data[1], data[2], alpha];
  return (color);
};

export default Batch;
