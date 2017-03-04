import {
  uid,
  inherit,
  createCanvasBuffer
} from "../../utils";

import Texture from "./Texture/index";

import * as _raw from "./raw";
import * as _bounds from "./bounds";

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
 * @param {Tile} tile
 */
Batch.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  this.updateBoundings();
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
 * Get tile color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getTileColorAt = function(x, y) {
  // nothing buffered and no tiles
  if (this.isEmpty()) return (null);
  // use image data for raw buffers
  if (this.isRawBuffer) {
    let color = this.getRawColorAt(x, y);
    if (color !== null) return (color);
  }
  // return background color if batch is a filled background
  if (this.isBackground) return (this.bgcolor);
  // search tile based
  let tile = this.getTileAt(x, y);
  if (tile !== null) return (tile.colors[tile.cindex]);
  return (null);
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
  this.buffer = new Texture(buffer);
  this.isBuffered = true;
  this.updateBoundings();
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

inherit(Batch, _raw);
inherit(Batch, _bounds);

export default Batch;
