import {
  UNSET_TILE_COLOR,
  BATCH_BUFFER_SIZE
} from "../../cfg";

import {
  sortAscending,
  createCanvasBuffer,
  alphaByteToRgbAlpha
} from "../../utils";

import Texture from "./Texture/index";

/**
 * @class Batch
 */
class Batch {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.index = 0;
    this.tiles = [];
    // background related, see 'renderBackground'
    this.buffer = null;
    this.bgcolor = null;
    this.bgbuffer = null;
    this.isBuffered = false;
    // This property indicates, if only the canvas buffer is available to us
    // e.g. used for inserted sprite images
    this.isRawBuffer = false;
    // If the batch should appear everywhere on the screen
    this.isBackground = false;
  }
};

/**
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
Batch.prototype.renderBackground = function(width, height, color) {
  let buffer = createCanvasBuffer(width, height);
  let r = color[0];
  let g = color[1];
  let b = color[2];
  let a = color[3];
  buffer.fillStyle = `rgba(${r},${g},${b},${a})`;
  buffer.fillRect(
    0, 0,
    width, height
  );
  this.bgcolor = color;
  this.bgbuffer = buffer.canvas;
};

/**
 * @param {Tile} tile
 */
Batch.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  this.updateBoundings();
};

/**
 * Updates the batch's relative position and size
 */
Batch.prototype.updateBoundings = function() {
  let info = this.getBoundings();
  this.x = info.x;
  this.y = info.y;
  this.width = info.w;
  this.height = info.h;
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
  px.sort(sortAscending);
  py.sort(sortAscending);
  let idx = px.length-1;
  // calculate rectangle position
  let xx = px[0]|0;
  let yy = py[0]|0;
  // calculate rectangle size
  let ww = ((px[idx] - px[0]) | 0) + 1;
  let hh = ((py[idx] - py[0]) | 0) + 1;
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
  this.updateBoundings();
  let buffer = createCanvasBuffer(this.width, this.height);
  let bx = this.x | 0;
  let by = this.y | 0;
  let tiles = this.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let color = tile.colors[tile.cindex];
    let xx = (tile.x - bx) | 0;
    let yy = (tile.y - by) | 0;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      xx, yy,
      1|0, 1|0
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
  if (!this.isBuffered) return ([0,0,0,UNSET_TILE_COLOR]);
  let data = this.buffer.context.getImageData(x, y, 1, 1).data;
  let alpha = alphaByteToRgbAlpha(data[3]);
  let color = [data[0], data[1], data[2], alpha];
  return (color);
};

export default Batch;
