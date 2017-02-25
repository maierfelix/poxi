(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

/**
 * @param {Class} cls
 * @param {Array} prot
 */
function inherit(cls, prot) {
  var key = null;
  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  }
}

/**
 * Returns a unique integer
 * @return {Number}
 */
var uidx = 0;
function uid() {
  return (uidx++);
}

/**
 * String to hashcode like on our island java
 * @param {String} str
 * @return {Number}
 */
function hashFromString(str) {
  var hash = 0;
  var length = str.length;
  for (var ii = 0; ii < length; ++ii) {
    var ch = str.charCodeAt(ii);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return (hash);
}

/**
 * @param {Number} width
 * @param {Number} height
 * @return {CanvasRenderingContext2D}
 */
function createCanvasBuffer(width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  applyImageSmoothing(ctx, false);
  return (ctx);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Boolean} state
 */
function applyImageSmoothing(ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
}

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
}

var TILE_SIZE = 8;
var MIN_SCALE = 0.25;
var MAX_SCALE = 32;
var BASE_TILE_COLOR = [0,0,0,0];

// 32-bit ints are allowed at maximum
var MAX_SAFE_INTEGER = (Math.pow( 2, 31 )) - 1;

// alpha byte to rgb-alpha conversion
var MAGIC_RGB_A_BYTE = 0.00392;

// factor when to hide the grid
var HIDE_GRID = 0.0;
var GRID_LINE_WIDTH = 0.25;

var ZOOM_SPEED = 56;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */
var BATCH_BUFFER_SIZE = {
  MIN_W: 8,
  MIN_H: 8,
  MIN_L: 32
};

var DRAW_HASH = hashFromString("draw");

/**
 * @param {Number} x
 * @return {Number}
 */
function zoomScale(x) {
  return (
    x >= 0 ? x + 1 :
    x < 0 ? x + 1 :
    x + 1
  );
}

/**
 * @param {Number} x
 * @param {Number} t
 * @return {Number}
 */
function roundTo(x, t) {
  var i = 1 / t;
  return (Math.round(x * i) / i);
}

/**
 * @class Camera
 */
var Camera = function Camera(instance) {
  this.x = 0;
  this.y = 0;
  this.s = MIN_SCALE + 6;
  this.dx = 0;
  this.dy = 0;
  this.lx = 0;
  this.ly = 0;
  this.width = 0;
  this.height = 0;
  this.instance = instance;
};

/**
 * @param {Number} dir
 */
Camera.prototype.scale = function scale (dir) {
  var x = (dir * ZOOM_SPEED) / (Math.hypot(this.width, this.height) / 2) * zoomScale(this.s);
  var oscale = this.s;
  if (this.s + x <= MIN_SCALE) { this.s = MIN_SCALE; }
  else if (this.s + x >= MAX_SCALE) { this.s = MAX_SCALE; }
  else { this.s += x; }
  this.s = roundTo(this.s, .125);
  this.x -= (this.lx) * (zoomScale(this.s) - zoomScale(oscale));
  this.y -= (this.ly) * (zoomScale(this.s) - zoomScale(oscale));
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Camera.prototype.click = function click (x, y) {
  var position = this.getRelativeOffset(x, y);
  this.dx = x;
  this.dy = y;
  this.lx = position.x;
  this.ly = position.y;
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Camera.prototype.drag = function drag (x, y) {
  this.x += x - this.dx;
  this.y += y - this.dy;
  this.dx = x;
  this.dy = y;
  // smooth dragging
  this.instance.clear();
  this.instance.render();
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Camera.prototype.getRelativeOffset = function getRelativeOffset (x, y) {
  var xx = (x - this.x) / this.s;
  var yy = (y - this.y) / this.s;
  return ({
    x: xx,
    y: yy
  });
};

/**
 * @param {Number} width
 * @param {Number} height
 */
Camera.prototype.resize = function resize (width, height) {
  this.width = width;
  this.height = height;
};

/**
 * @param {Object} op
 */
function enqueue(op) {
  // our stack index is out of position
  // => clean up all more recent batches
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  } else {
    this.stack.splice(this.sindex + 1, this.stack.length);
  }
  this.stack.push(op);
  this.redo();
  this.undo();
  this.redo();
}

/**
 * Dequeue items from stack
 * @param {Number} from
 * @param {Number} to
 */
function dequeue(from, to) {
  var this$1 = this;

  from = from + 1;
  var count = (to - (from - 1));
  var batches = this.batches;
  // free all following (more recent) tile batches
  for (var ii = count; ii > 0; --ii) {
    this$1.batches.splice(from + ii - 1, 1);
    this$1.refreshBatches();
    this$1.stack.splice(from + ii - 1, 1);
  }
}

/**
 * @param {Array} op
 * @param {Boolean} state
 */
function fire(op, state) {
  op.batch.tiles.map(function (tile) {
    var cindex = tile.cindex;
    if (state) {
      // redo
      tile.cindex -= (tile.cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (tile.cindex < tile.colors.length - 1 ? 1 : 0);
    }
  });
}

function currentStackOperation() {
  return (this.stack[this.sindex]);
}

function undo() {
  if (this.sindex >= 0) {
    var op = this.currentStackOperation();
    this.fire(op, false);
    this.sindex--;
  }
}

function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    var op = this.currentStackOperation();
    this.fire(op, true);
  }
}


var _stack = Object.freeze({
	enqueue: enqueue,
	dequeue: dequeue,
	fire: fire,
	currentStackOperation: currentStackOperation,
	undo: undo,
	redo: redo
});

/**
 * @class Tile
 */
var Tile = function Tile() {
  this.x = 0;
  this.y = 0;
  this.id = uid();
  this.cindex = 0;
  this.colors = [BASE_TILE_COLOR];
  this.isHovered = false;
};
/**
 * @param {Array} color
 * @return {Boolean}
 */
Tile.prototype.colorMatchesWithTile = function colorMatchesWithTile (color) {
  var owncolor = this.colors[this.cindex];
  return (
    owncolor[0] === color[0] &&
    owncolor[1] === color[1] &&
    owncolor[2] === color[2] &&
    owncolor[3] === color[3]
  );
};
/**
 * @param {Number} cindex
 * @return {String}
 */
Tile.prototype.getColorAsRgbaString = function getColorAsRgbaString (cindex) {
  var c = this.colors[cindex || 0];
  var r = c[0];
  var g = c[1];
  var b = c[2];
  var a = c[3];
  return (
    ("rgba(" + r + "," + g + "," + b + "," + a + ")")
  );
};

/**
 * Set ctrl+a mode=true
 */
function selectAll() {
  this.modes.selectAll = true;
}

/**
 * Hover & unhover tiles
 * @param {Number} x
 * @param {Number} y
 */
function hover(x, y) {
  this.mx = x;
  this.my = y;
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    var position = this.getRelativeOffset(x, y);
    this.createBatchTileAt(position.x, position.y, this.colorTest);
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Tile}
 */
function drawTileAt(x, y, color) {
  this.pushTileBatchOperation();
  this.createBatchTileAt((x*TILE_SIZE)|0, (y*TILE_SIZE)|0, color);
  this.finalizeBatchOperation();
  return (tile);
}

/**
 * Returns rnd(0-255) rgba color array with a=1
 * @return {Array}
 */
function getRandomRgbaColors() {
  var cmax = 256;
  var r = (Math.random() * cmax) | 0;
  var g = (Math.random() * cmax) | 0;
  var b = (Math.random() * cmax) | 0;
  return ([r, g, b, 1]);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getStackRelativeTileColorByMouseOffset(x, y) {
  var tile = this.getStackRelativeTileByMouseOffset(x, y);
  if (tile !== null) { return (tile.color[tile.cindex]); }
  return (BASE_TILE_COLOR);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getStackRelativeTileColorAt(x, y) {
  var tile = this.getStackRelativeTileAt(x, y);
  if (tile !== null) { return (tile.color[tile.cindex]); }
  return (BASE_TILE_COLOR);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getRelativeOffset$1(x, y) {
  var rpos = this.camera.getRelativeOffset(x, y);
  var tpos = this.getTileOffsetAt(rpos.x, rpos.y);
  return (tpos);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function createTileAtMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = this.createTileAt(position.x, position.y);
  return (tile);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function createTileAt(x, y) {
  var tile = new Tile();
  if (!this.offsetExceedsIntegerLimit(x, y)) {
    tile.x = x;
    tile.y = y;
  } else {
    throw new Error("Tile position exceeds 32-bit integer limit!");
  }
  return (tile);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function getTileByMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = this.getTileAt(position.x, position.y);
  return (tile);
}

/**
 * Gets non-relative (stack independant) tile by given position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function getTileAt(x, y) {
  var target = null;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii].tiles;
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        target = tile;
      }
    }
  }
  return (target);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function getStackRelativeTileByMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = this.getStackRelativeTileAt(position.x, position.y);
  return (tile);
}

/**
 * Gets stack relative (absolute) tile by given position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function getStackRelativeTileAt(x, y) {
  var target = null;
  var sIndex = this.sindex;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii].tiles;
    if (sIndex - ii < 0) { continue; }
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        target = tile;
      }
    }
  }
  return (target);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getTileOffsetAt(x, y) {
  var half = TILE_SIZE / 2;
  var xx = roundTo(x - half, TILE_SIZE);
  var yy = roundTo(y - half, TILE_SIZE);
  return ({
    x: xx,
    y: yy
  });
}

/**
 * Get tile by it's id
 * @param {Number} id
 * @return {Tile}
 */
function getTileById(id) {
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var tiles = batches[ii].tiles;
    for (var jj = 0; jj < tiles.length; ++jj) {
      var tile = tiles[jj];
      if (tile.id === id) { return (tile); }
    }
  }
  return null;
}

/**
 * Checks if given tile is inside camera view
 * @param {Tile} tile
 * @return {Boolean}
 */
function isTileInsideView(tile) {
  var scale = this.camera.s;
  var width = this.camera.width;
  var height = this.camera.height;
  var tilew = TILE_SIZE * scale;
  var tileh = TILE_SIZE * scale;
  var x = (tile.x * scale) + this.camera.x;
  var y = (tile.y * scale) + this.camera.y;
  return (
    (x + tilew) >= 0 && x <= width &&
    (y + tileh) >= 0 && y <= height
  );
}


var _tiles = Object.freeze({
	selectAll: selectAll,
	hover: hover,
	drawTileAtMouseOffset: drawTileAtMouseOffset,
	drawTileAt: drawTileAt,
	getRandomRgbaColors: getRandomRgbaColors,
	getStackRelativeTileColorByMouseOffset: getStackRelativeTileColorByMouseOffset,
	getStackRelativeTileColorAt: getStackRelativeTileColorAt,
	getRelativeOffset: getRelativeOffset$1,
	createTileAtMouseOffset: createTileAtMouseOffset,
	createTileAt: createTileAt,
	getTileByMouseOffset: getTileByMouseOffset,
	getTileAt: getTileAt,
	getStackRelativeTileByMouseOffset: getStackRelativeTileByMouseOffset,
	getStackRelativeTileAt: getStackRelativeTileAt,
	getTileOffsetAt: getTileOffsetAt,
	getTileById: getTileById,
	isTileInsideView: isTileInsideView
});

/**
 * @class Texture
 */
var Texture = function Texture(ctx, x, y) {
  this.x = x;
  this.y = y;
  var view = ctx.canvas;
  this.view = view;
  this.width = view.width;
  this.height = view.height;
  this.context = ctx;
  this.tiles = [];
};

/**
 * @class Batch
 */
var Batch = function Batch() {
  this.index = 0;
  this.tiles = [];
  this.buffer = null;
  this.isBuffered = false;
  /**
   * This property indicates, if only
   * the canvas buffer is available to us
   * e.g. used for inserted sprite images
   */
  this.isRawBuffer = false;
};

/**
 * Calculate cropped size of given batch
 * @return {Object}
 */
Batch.prototype.getBoundings = function() {
  // start position at maximum buffer size
  var x = BATCH_BUFFER_SIZE.MAX_W;
  var y = BATCH_BUFFER_SIZE.MAX_H;
  var px = [];
  var py = [];
  var tiles = this.tiles;
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    px.push(tile.x);
    py.push(tile.y);
  }
  px.sort(function (a, b) { return a - b; });
  py.sort(function (a, b) { return a - b; });
  var idx = px.length-1;
  // calculate rectangle position
  var xx = (px[0] / TILE_SIZE) | 0;
  var yy = (py[0] / TILE_SIZE) | 0;
  // calculate rectangle size
  var ww = (((px[idx] - px[0]) / TILE_SIZE) | 0) + 1;
  var hh = (((py[idx] - py[0]) / TILE_SIZE) | 0) + 1;
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
  var info = this.getBoundings();
  var buffer = createCanvasBuffer(info.w, info.h);
  var bx = info.x | 0;
  var by = info.y | 0;
  var tiles = this.tiles;
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    var color = tile.colors[tile.cindex];
    var xx = (tile.x / TILE_SIZE) - bx;
    var yy = (tile.y / TILE_SIZE) - by;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      xx|0, yy|0,
      1|0, 1|0
    );
  }
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
  if (this.tiles.length >= BATCH_BUFFER_SIZE.MIN_L) { return (true); }
  var size = this.getBoundings();
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
  if (!this.isBuffered) { return ([0,0,0,0]); }
  var data = this.buffer.context.getImageData(x, y, 1, 1).data;
  var alpha = alphaByteToRgbAlpha(data[3]);
  var color = [data[0], data[1], data[2], alpha];
  return (color);
};

/**
 * Push in a new batch operation
 */
function pushTileBatchOperation() {
  var batch = new Batch();
  this.batches.push(batch);
  this.refreshBatches();
}

function refreshBatches() {
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    batch.index = ii;
  }
}

/**
 * @return {Batch}
 */
function getLatestTileBatchOperation() {
  var offset = this.batches.length - 1;
  return (this.batches[offset]);
}

/**
 * Take the latest tile batch, buffer it (if exceeds bound sizes)
 * and finally push it into the operation stack
 */
function finalizeBatchOperation() {
  var offset = this.batches.length - 1;
  var batch = this.batches[offset];
  if (batch.exceedsBounds() && !batch.isRawBuffer) {
    batch.renderBuffer();
  }
  this.enqueue({
    batch: batch,
    index: offset
  });
}

/**
 * Clear latest batch operation if empty
 */
function clearLatestTileBatch() {
  var batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (!batch.tiles.length) {
    var offset = this.batches.length - 1;
    this.batches.splice(offset, 1);
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function startBatchedDrawing(x, y) {
  this.modes.draw = true;
  var position = this.getRelativeOffset(x, y);
  this.colorTest = this.getRandomRgbaColors();
  this.pushTileBatchOperation();
  this.createBatchTileAt(position.x, position.y, this.colorTest);
}

/**
 * Finally push the recently created batch into the stack
 * @param {Number} x
 * @param {Number} y
 */
function stopBatchedDrawing(x, y) {
  this.modes.draw = false;
  this.finalizeBatchOperation();
  this.clearLatestTileBatch();
}

/**
 * Main method to insert tiles into the active batch
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function createBatchTileAt(x, y, color) {
  // try to overwrite older tiles color
  var otile = this.getTileAt(x, y);
  var batch = this.getLatestTileBatchOperation();
  // only push tile if necessary
  if (otile !== null && otile.colorMatchesWithTile(color)) { return; }
  var tile = this.createTileAt(x, y);
  tile.colors.unshift(color);
  batch.tiles.push(tile);
}

/**
 * Get batch by the given tile
 * @param {Tile} tile
 * @return {Batch}
 */
function getBatchByTile(tile) {
  var id = tile.id;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var tiles = batches[ii].tiles;
    for (var jj = 0; jj < tiles.length; ++jj) {
      var tile$1 = tiles[jj];
      if (tile$1.id === id) { return (batches[ii]); }
    }
  }
  return null;
}


var _batch = Object.freeze({
	pushTileBatchOperation: pushTileBatchOperation,
	refreshBatches: refreshBatches,
	getLatestTileBatchOperation: getLatestTileBatchOperation,
	finalizeBatchOperation: finalizeBatchOperation,
	clearLatestTileBatch: clearLatestTileBatch,
	startBatchedDrawing: startBatchedDrawing,
	stopBatchedDrawing: stopBatchedDrawing,
	createBatchTileAt: createBatchTileAt,
	getBatchByTile: getBatchByTile
});

/**
 * Inserts filled rectangle at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
function fillRect(x, y, width, height, color) {
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertRectangleAt(
    x | 0, y | 0,
    width | 0, height | 0,
    color, true
  );
}

/**
 * Inserts stroked rectangle at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
function strokeRect(x, y, width, height, color) {
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertRectangleAt(
    x | 0, y | 0,
    width | 0, height | 0,
    color, false
  );
}

/**
 * Inserts rectangle at given position
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Array} color
 * @param {Boolean} filled
 */
function insertRectangleAt(x1, y1, x2, y2, color, filled) {
  var this$1 = this;

  var width = Math.abs(x2);
  var height = Math.abs(y2);
  this.pushTileBatchOperation();
  var dx = (x2 < 0 ? -1 : 1);
  var dy = (y2 < 0 ? -1 : 1);
  var x = x1 * TILE_SIZE;
  var y = y1 * TILE_SIZE;
  for (var yy = 0; yy < height; ++yy) {
    for (var xx = 0; xx < width; ++xx) {
      // ignore inner tiles if rectangle not filled
      if (!filled) {
        if (!(
          (xx === 0 || xx >= width-1) ||
          (yy === 0 || yy >= height-1))
        ) { continue; }
      }
      this$1.createBatchTileAt(x + ((xx * TILE_SIZE)) * dx, y + ((yy * TILE_SIZE)) * dy, color);
    }
  }
  this.finalizeBatchOperation();
}

/**
 * Transforms passed canvas ctx into a single batch operation
 * Instead of drawing tiles for each pixel,
 * we just directly draw all of them into a canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
function drawImage(ctx, x, y) {
  var canvas = ctx.canvas;
  var width = canvas.width;
  var height = canvas.height;
  var xx = 0;
  var yy = 0;
  // start ctx insertion from given position
  var data = ctx.getImageData(0, 0, width, height).data;
  var position = this.getRelativeOffset(x, y);
  var mx = position.x;
  var my = position.y;
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  batch.isBuffered = true;
  batch.isRawBuffer = true;
  batch.buffer = new Texture(ctx, mx / TILE_SIZE, my / TILE_SIZE);
  this.finalizeBatchOperation();
}


var _insert = Object.freeze({
	fillRect: fillRect,
	strokeRect: strokeRect,
	insertRectangleAt: insertRectangleAt,
	drawImage: drawImage
});

/**
 * Shade or tint
 * @param {Batch} batch
 * @param {Number} factor
 */
function applyColorLightness(batch, factor) {
  var this$1 = this;

  var tiles = batch.tiles;
  this.pushTileBatchOperation();
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    var color = tile.colors[tile.cindex];
    var t = factor < 0 ? 0 : 255;
    var p = factor < 0 ? -factor : factor;
    var r = (Math.round((t - color[0]) * p) + color[0]);
    var g = (Math.round((t - color[1]) * p) + color[1]);
    var b = (Math.round((t - color[2]) * p) + color[2]);
    var a = color[3];
    this$1.createBatchTileAt(tile.x, tile.y, [r,g,b,a]);
  }
  this.finalizeBatchOperation();
}

/**
 * Remove L shaped corners
 * http://deepnight.net/pixel-perfect-drawing/
 * @param {Batch} batch
 */
function applyPixelSmoothing(batch) {
  var tiles = batch.tiles;
  for (var ii = 0; ii < tiles.length; ++ii) {
    if (!(ii > 0 && ii + 1 < tiles.length)) { continue; }
    var o = tiles[ii];
    var e = tiles[ii + 1];
    var w = tiles[ii - 1];
    if (
      (w.x === o.x  || w.y === o.y) &&
      (e.x === o.x  || e.y === o.y) &&
      (w.x !== e.x) && (w.y !== e.y)
    ) {
      tiles.splice(ii, 1);
      ++ii;
    }
  }
}


var _transform = Object.freeze({
	applyColorLightness: applyColorLightness,
	applyPixelSmoothing: applyPixelSmoothing
});

/**
 * @class Editor
 */
var Editor = function Editor(instance) {
  this.instance = instance;
  this.modes = {
    draw: false,
    selectAll: false
  };
  this.batches = [];
  // mouse position, negative to be hidden initially
  this.mx = -TILE_SIZE;
  this.my = -TILE_SIZE;
  this.colorTest = null;
  this.camera = instance.camera;
  // stack related
  this.sindex = -1;
  this.stack = [];
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
Editor.prototype.offsetExceedsIntegerLimit = function offsetExceedsIntegerLimit (x, y) {
  return (
    Math.abs(x) > MAX_SAFE_INTEGER || Math.abs(y) > MAX_SAFE_INTEGER
  );
};

inherit(Editor, _stack);
inherit(Editor, _tiles);
inherit(Editor, _batch);
inherit(Editor, _insert);
inherit(Editor, _transform);

/**
 * @param {Number} width
 * @param {Number} height
 */
function resize$1(width, height) {
  if (width >= 0) { this.width = width; }
  if (height >= 0) { this.height = height; }
  this.view.width = width;
  this.view.height = height;
  applyImageSmoothing(this.ctx, false);
  this.camera.resize(width, height);
  // re-generate our bg
  this.generateBackground();
  this.clear();
  this.render();
}

function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

function render() {
  this.renderBackground();
  this.renderBatches();
  if (this.camera.s > (MIN_SCALE + HIDE_GRID)) {
    this.renderGrid();
  }
  this.renderStats();
}

function renderBackground() {
  var width = this.camera.width;
  var height = this.camera.height;
  this.ctx.drawImage(
    this.bg,
    0, 0,
    width, height,
    0, 0,
    width, height
  );
}

function renderGrid() {
  var ctx = this.ctx;
  var size = (TILE_SIZE*this.camera.s)|0;
  var cx = this.camera.x;
  var cy = this.camera.y;
  var cw = this.camera.width;
  var ch = this.camera.height;
  ctx.lineWidth = GRID_LINE_WIDTH;
  ctx.strokeStyle = "rgba(51,51,51,0.75)";
  ctx.beginPath();
  for (var xx = (cx%size)|0; xx < cw; xx += size) {
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, ch);
  }
  for (var yy = (cy%size)|0; yy < ch; yy += size) {
    ctx.moveTo(0, yy);
    ctx.lineTo(cw, yy);
  }
  ctx.stroke();
  ctx.closePath();
}

function renderBatches() {
  var this$1 = this;

  var sIndex = this.editor.sindex;
  var batches = this.editor.stack;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii].batch;
    // batch index is higher than stack index, so ignore this batch
    if (sIndex - ii < 0) { continue; }
    // draw batched buffer (faster, drawImage)
    if (batch.isBuffered) { this$1.drawBatchedBuffer(batch); }
    // draw batched tiles (slower, fillRect)
    else { this$1.drawBatchedTiles(batch); }
  }
  // draw currently drawn tiles
  if (this.editor.modes.draw) {
    var length = this.editor.batches.length;
    if (length > 0) { this.drawBatchedTiles(this.editor.batches[length - 1]); }
  }
  this.drawHoveredTile();
}

/**
 * @param {Batch} batch
 */
function drawBatchedTiles(batch) {
  var this$1 = this;

  var cx = this.camera.x;
  var cy = this.camera.y;
  var scale = this.camera.s;
  var ww = (TILE_SIZE * scale) | 0;
  var hh = (TILE_SIZE * scale) | 0;
  var ctx = this.ctx;
  var tiles = batch.tiles;
  for (var jj = 0; jj < tiles.length; ++jj) {
    var tile = tiles[jj];
    if (!this$1.editor.isTileInsideView(tile)) { continue; }
    var x = (cx + (tile.x * scale)) | 0;
    var y = (cy + (tile.y * scale)) | 0;
    var color = tile.colors[tile.cindex];
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    ctx.fillRect(x, y, ww, hh);
  }
}

/**
 * @param {Batch} batch
 */
function drawBatchedBuffer(batch) {
  var cx = this.camera.x | 0;
  var cy = this.camera.y | 0;
  var scale = this.camera.s;
  var bx = batch.buffer.x;
  var by = batch.buffer.y;
  var x = (cx + (bx * scale) * TILE_SIZE) | 0;
  var y = (cy + (by * scale) * TILE_SIZE) | 0;
  var width = (batch.buffer.width * TILE_SIZE) | 0;
  var height = (batch.buffer.height * TILE_SIZE) | 0;
  this.ctx.drawImage(
    batch.buffer.view,
    0, 0,
    width, height,
    x, y,
    (width * TILE_SIZE * scale) | 0, (height * TILE_SIZE * scale) | 0
  );
}

function drawHoveredTile() {
  var ctx = this.ctx;
  var cx = this.camera.x;
  var cy = this.camera.y;
  var scale = this.camera.s;
  var ww = (TILE_SIZE * scale) | 0;
  var hh = (TILE_SIZE * scale) | 0;
  // apply empty tile hover color
  var mx = this.editor.mx;
  var my = this.editor.my;
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x;
  var ry = relative.y;
  var x = ((cx + GRID_LINE_WIDTH/2) + (rx * scale)) | 0;
  var y = ((cy + GRID_LINE_WIDTH/2) + (ry * scale)) | 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x, y, ww, hh);
}

function renderStats() {
  this.ctx.fillStyle = "#ffffff";
  // render mouse hovered color
  var mx = this.editor.mx;
  var my = this.editor.my;
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x;
  var ry = relative.y;
  var tile = this.editor.getTileAt(rx, ry);
  this.ctx.fillText(("x:" + (rx / TILE_SIZE) + ", y:" + (ry / TILE_SIZE)), 16, 32);
  if (tile !== null) {
    var color = tile.colors[tile.cindex];
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    this.ctx.fillText((r + "," + g + "," + b + "," + a), 16, 48);
  }
  this.renderFPS();
}

function renderFPS() {
  var now = Date.now();
  var delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
}

/**
 * Background grid as transparency placeholder
 */
function generateBackground() {

  var size = 8;

  var cw = this.width;
  var ch = this.height;

  var buffer = createCanvasBuffer(cw, ch);

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  canvas.width = cw;
  canvas.height = ch;

  this.bg = canvas;

  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);

  // bright rectangles
  ctx.fillStyle = "#212121";
  for (var yy = 0; yy < ch; yy += size*2) {
    for (var xx = 0; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    }
  }
  for (var yy$1 = size; yy$1 < ch; yy$1 += size*2) {
    for (var xx$1 = size; xx$1 < cw; xx$1 += size*2) {
      ctx.fillRect(xx$1, yy$1, size, size);
    }
  }

}

var _render = Object.freeze({
	resize: resize$1,
	clear: clear,
	render: render,
	renderBackground: renderBackground,
	renderGrid: renderGrid,
	renderBatches: renderBatches,
	drawBatchedTiles: drawBatchedTiles,
	drawBatchedBuffer: drawBatchedBuffer,
	drawHoveredTile: drawHoveredTile,
	renderStats: renderStats,
	renderFPS: renderFPS,
	generateBackground: generateBackground
});

/**
 * @class Picaxo
 */
var Picaxo = function Picaxo(obj) {
  this.bg = null;
  this.ctx = null;
  this.view = null;
  this.events = {};
  this.camera = new Camera(this);
  this.editor = new Editor(this);
  // fps
  this.last = 0;
  this.width = 0;
  this.height = 0;
  this.frames = 0;
  this.states = {
    paused: true
  };
  this.createView();
  // apply sizing
  if (obj.width >= 0 && obj.height >= 0) {
    this.resize(obj.width, obj.height);
  } else {
    this.resize(view.width, view.height);
  }
  this.init();
};

Picaxo.prototype.init = function init () {
  this.renderLoop();
};

Picaxo.prototype.createView = function createView () {
  var buffer = createCanvasBuffer(this.width, this.height);
  this.ctx = buffer;
  this.view = buffer.canvas;
};

Picaxo.prototype.renderLoop = function renderLoop () {
    var this$1 = this;

  // try again to render in 16ms
  if (this.states.paused === true) {
    setTimeout(function () { return this$1.renderLoop(); }, 16);
  } else {
    requestAnimationFrame(function () {
      this$1.events[DRAW_HASH].fn();
      this$1.frames++;
      this$1.renderLoop();
    });
  }
};

/**
 * @param {HTMLCanvasElement} el
 */
Picaxo.prototype.isViewElement = function isViewElement (el) {
  return (
    el && el instanceof HTMLCanvasElement
  );
};

/**
 * Event emitter
 * @param {String} kind
 * @param {Function} fn
 */
Picaxo.prototype.on = function on (kind, fn) {
  if (!(typeof kind === "string")) {
    throw new Error("Expected emitter kind to be string");
  }
  if (!(fn instanceof Function)) {
    throw new Error("Received emitter trigger is not a function");
  }
  var hash = hashFromString(kind);
  if (this.events[hash]) { this.events[hash] = null; } // safely clean old emitters
  this.events[hash] = {
    fn: fn
  };
  this.processEmitter(hash, fn);
};

/**
 * @param {Number} hash
 * @param {Function} fn
 */
Picaxo.prototype.processEmitter = function processEmitter (hash, fn) {
  // begin drawing as soon as we got something to do there
  if (this.frames === 0 && hash === DRAW_HASH) {
    this.states.paused = false;
  }
};

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Please run Picaxo inside a browser");
}

})));
