import {
  UNSET_TILE_COLOR,
  BATCH_BUFFER_SIZE
} from "../../cfg";

import {
  uid,
  isGhostColor,
  sortAscending,
  createCanvasBuffer,
  alphaByteToRgbAlpha
} from "../../utils";

import { intersectRectangles } from "../../math";

import Tile from "../Tile/index";
import Texture from "./Texture/index";

/**
 * @class Batch
 */
class Batch {
  constructor() {
    this.id = uid();
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
 * Check if points lies inside the batch
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
Batch.prototype.pointInsideBoundings = function(x, y) {
  if (this.isBackground) return (true);
  let state = intersectRectangles(
    this.x, this.y, this.width, this.height,
    x, y, 0, 0
  );
  return (state);
};

/**
 * Updates the batch's relative position and size
 * @return {Void}
 */
Batch.prototype.updateBoundings = function() {
  // dont calculate sizes of raw buffers
  if (this.isRawBuffer) return;
  // background boundings are infinite
  if (this.isBackground) {
    this.x = this.y = this.width = this.height = Infinity;
    return;
  }
  let info = this.getBoundings();
  this.x = info.x;
  this.y = info.y;
  this.width = info.w;
  this.height = info.h;
  return;
};

/**
 * Calculate cropped size of given batch
 * @return {Object}
 */
Batch.prototype.getBoundings = function() {
  // raw buffers have static bounding
  if (this.isRawBuffer) {
    return ({
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    });
  }
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
 * @param {CanvasRenderingContext2D}
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.createRawBufferAt = function(ctx, x, y) {
  let view = ctx.canvas;
  this.x = x;
  this.y = y;
  this.width = view.width;
  this.height = view.height;
  this.isBuffered = true;
  this.isRawBuffer = true;
  this.isBackground = false;
  this.buffer = new Texture(ctx, x, y);
};

/**
 * Warning: does not update boundings!
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
Batch.prototype.createRawTileAt = function(x, y, color) {
  let tile = new Tile();
  tile.x = x;
  tile.y = y;
  tile.colors.unshift(color);
  // push in without updating boundings each time
  this.tiles.push(tile);
};

/**
 * Creates a cropped canvas buffer
 */
Batch.prototype.renderBuffer = function() {
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
  this.updateBoundings();
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
 * Batch is completely empty
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  return (
    !this.isBuffered &&
    !this.isRawBuffer &&
    !this.isBackground &&
    this.tiles.length <= 0
  );
};

/**
 * Get tile color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getTileColorAt = function(x, y) {
  // nothing buffered and no tiles
  if (this.isEmpty()) return (null);
  // use getImageData for raw buffers
  if (this.isRawBuffer) {
    // normalize coordinates
    let xx = x - this.x;
    let yy = y - this.y;
    // first check if coordinates lie inside our buffer
    if (xx < 0 || yy < 0) return (null);
    if (xx > this.width || this.yy > this.height) return (null);
    // now extract the data
    let data = this.buffer.context.getImageData(xx, yy, 1, 1).data;
    let alpha = alphaByteToRgbAlpha(data[3]);
    let color = [data[0], data[1], data[2], alpha];
    // image color data is fully transparent
    if (isGhostColor(color) || alpha <= 0) return (null);
    return (
      [data[0], data[1], data[2], alpha]
    );
  }
  // return background color if batch is a filled background
  if (this.isBackground) {
    return (this.bgcolor);
  }
  // search tile based
  let tile = this.getTileAt(x, y);
  if (tile !== null) return (tile.colors[tile.cindex]);
  return (null);
};

/**
 * Get tile at relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
Batch.prototype.getTileAt = function(x, y) {
  let tiles = this.tiles;
  let length = tiles.length;
  for (let ii = 0; ii < length; ++ii) {
    let tile = tiles[ii];
    if (tile.x === x && tile.y === y) return (tile);
  };
  return (null);
};

/**
 * @param {Tile} tile
 */
Batch.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  this.updateBoundings();
};

export default Batch;
