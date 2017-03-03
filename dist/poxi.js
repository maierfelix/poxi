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
 * @param {String} path
 * @param {Function} resolve
 */
function loadImage(path, resolve) {
  var img = new Image();
  img.addEventListener("load", function () {
    resolve(img);
  });
  img.addEventListener("error", function () {
    throw new Error("Failed to load image ressource " + path);
  });
  img.src = path;
}

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
}

/**
 * @param {Array} color
 * @return {String}
 */
function colorToRgbaString(color) {
  var r = color[0];
  var g = color[1];
  var b = color[2];
  var a = color[3];
  return (("rgba(" + r + "," + g + "," + b + "," + a + ")"));
}

/**
 * Hex to rgba
 * @param {String} hex
 */
function hexToRgba(hex) {
  var r = parseInt(hex.substring(1,3), 16);
  var g = parseInt(hex.substring(3,5), 16);
  var b = parseInt(hex.substring(5,7), 16);
  return ([r,g,b,1]);
}

/**
 * Do rgba color arrays match
 * @param {Array} a
 * @param {Array} a
 * @return {Boolean}
 */
function colorsMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
}

/**
 * Checks if a color array is fully transparent
 * @param {Array} color
 * @return {Boolean}
 */
var transparent = [0, 0, 0, 0];
function isGhostColor(color) {
  return (colorsMatch(color, transparent));
}

/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
function sortAscending(a, b) {
  return (a - b);
}

/**
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */

var TILE_SIZE = 8;
var MIN_SCALE = 0.25;
var MAX_SCALE = 32;
var MAGIC_SCALE = .125;
// trace ghost tiles by alpha=^2
var UNSET_TILE_COLOR = 2;
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
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} w1
 * @param {Number} h1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Number} w2
 * @param {Number} h2
 * @return {Boolean}
 */
function intersectRectangles(x1, y1, w1, h1, x2, y2, w2, h2) {
  var x = Math.max(x1, x2);
  var w = Math.min(x1 + w1, x2 + w2);
  var y = Math.max(y1, y2);
  var h = Math.min(y1 + h1, y2 + h2);
  return (w >= x && h >= y);
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
  this.s = roundTo(this.s, MAGIC_SCALE);
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
  this.refreshStack();
  this.stack.push(op);
  this.redo();
  this.undo();
  this.redo();
}

/**
 * Manually refresh the stack,
 * clear future operations etc.
 */
function refreshStack() {
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  } else {
    this.stack.splice(this.sindex + 1, this.stack.length);
  }
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
	refreshStack: refreshStack,
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
};
/**
 * @param {Array} color
 * @return {Boolean}
 */
Tile.prototype.colorMatchesWithTile = function colorMatchesWithTile (color) {
  return (
    colorsMatch(this.colors[this.cindex], color)
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
 * Save last mouse position globally
 * @param {Number} x
 * @param {Number} y
 */
function hover(x, y) {
  this.mx = x;
  this.my = y;
}

/**
 * Erase a tile by mouse offset
 * @param {Number} x
 * @param {Number} y
 */
function eraseTileAtMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  this.eraseTileAt(position.x, position.y);
}

/**
 * Erase a tile at given relative position
 * @param {Number} x
 * @param {Number} y
 */
function eraseTileAt(x, y) {
  var tile = this.getStackRelativeTileAt(x, y);
  this.pushTileBatchOperation();
  if (tile !== null) {
    var color = tile.colors.shift();
    this.createBatchTileAt(tile.x, tile.y, [0,0,0,0]);
  }
  this.finalizeBatchOperation();
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    var position = this.getRelativeOffset(x, y);
    this.createBatchTileAt(position.x, position.y, this._fillStyle);
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
  this.createBatchTileAt(x|0, y|0, color);
  this.finalizeBatchOperation();
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
    tile.x = x | 0;
    tile.y = y | 0;
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
    x: xx / TILE_SIZE,
    y: yy / TILE_SIZE
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
  return (null);
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
function getTileColorAt(x, y) {
  var target = null;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    // buffer color
    var color = batch.getTileColorAt(x, y);
    if (color !== null) { target = color; }
  }
  return (target);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getStackRelativeTileColorAt(x, y) {
  var target = null;
  var sIndex = this.sindex;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    if (sIndex - ii < 0) { continue; }
    var color = batch.getTileColorAt(x, y);
    if (color !== null) { target = color; }
  }
  return (target);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getStackRelativeTileColorByMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  return (this.getStackRelativeTileColorAt(position.x, position.y));
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
  var x = ((tile.x * TILE_SIZE) * scale) + this.camera.x;
  var y = ((tile.y * TILE_SIZE) * scale) + this.camera.y;
  return (
    (x + tilew) >= 0 && (x - tilew) <= width &&
    (y + tileh) >= 0 && (y - tileh) <= height
  );
}


var _tiles = Object.freeze({
	selectAll: selectAll,
	hover: hover,
	eraseTileAtMouseOffset: eraseTileAtMouseOffset,
	eraseTileAt: eraseTileAt,
	drawTileAtMouseOffset: drawTileAtMouseOffset,
	drawTileAt: drawTileAt,
	getRelativeOffset: getRelativeOffset$1,
	createTileAtMouseOffset: createTileAtMouseOffset,
	createTileAt: createTileAt,
	getTileByMouseOffset: getTileByMouseOffset,
	getTileAt: getTileAt,
	getStackRelativeTileByMouseOffset: getStackRelativeTileByMouseOffset,
	getStackRelativeTileAt: getStackRelativeTileAt,
	getTileOffsetAt: getTileOffsetAt,
	getTileById: getTileById,
	getRandomRgbaColors: getRandomRgbaColors,
	getTileColorAt: getTileColorAt,
	getStackRelativeTileColorAt: getStackRelativeTileColorAt,
	getStackRelativeTileColorByMouseOffset: getStackRelativeTileColorByMouseOffset,
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
};

/**
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
Batch.prototype.renderBackground = function(width, height, color) {
  var buffer = createCanvasBuffer(width, height);
  var r = color[0];
  var g = color[1];
  var b = color[2];
  var a = color[3];
  buffer.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
  buffer.fillRect(
    0, 0,
    width, height
  );
  this.bgcolor = color;
  this.bgbuffer = buffer.canvas;
};

/**
 * Updates the batch's relative position and size
 */
Batch.prototype.updateBoundings = function() {
  // dont calculate sizes of raw buffers
  if (this.isRawBuffer) { return; }
  var info = this.getBoundings();
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
  // raw buffers have static bounding
  if (this.isRawBuffer) {
    return ({
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    });
  }
  var px = [];
  var py = [];
  var tiles = this.tiles;
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    px.push(tile.x);
    py.push(tile.y);
  }
  px.sort(sortAscending);
  py.sort(sortAscending);
  var idx = px.length-1;
  // calculate rectangle position
  var xx = px[0]|0;
  var yy = py[0]|0;
  // calculate rectangle size
  var ww = ((px[idx] - px[0]) | 0) + 1;
  var hh = ((py[idx] - py[0]) | 0) + 1;
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
  var view = ctx.canvas;
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
  var tile = new Tile();
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
  var buffer = createCanvasBuffer(this.width, this.height);
  var bx = this.x | 0;
  var by = this.y | 0;
  var tiles = this.tiles;
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    var color = tile.colors[tile.cindex];
    var xx = (tile.x - bx) | 0;
    var yy = (tile.y - by) | 0;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      xx, yy,
      1|0, 1|0
    );
  }
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
  if (this.tiles.length >= BATCH_BUFFER_SIZE.MIN_L) { return (true); }
  var size = this.getBoundings();
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
  if (this.isEmpty()) { return (null); }
  // use getImageData for raw buffers
  if (this.isRawBuffer) {
    // normalize coordinates
    var xx = x - this.x;
    var yy = y - this.y;
    // first check if coordinates lie inside our buffer
    if (xx < 0 || yy < 0) { return (null); }
    if (xx > this.width || this.yy > this.height) { return (null); }
    // now extract the data
    var data = this.buffer.context.getImageData(xx, yy, 1, 1).data;
    var alpha = alphaByteToRgbAlpha(data[3]);
    var color = [data[0], data[1], data[2], alpha];
    // image color data is fully transparent
    if (isGhostColor(color) || alpha <= 0) { return (null); }
    return (
      [data[0], data[1], data[2], alpha]
    );
  }
  // return background color if batch is a filled background
  if (this.isBackground) {
    return (this.bgcolor);
  }
  // search tile based
  var tile = this.getTileAt(x, y);
  if (tile !== null) { return (tile.colors[tile.cindex]); }
  return (null);
};

/**
 * Get tile at relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
Batch.prototype.getTileAt = function(x, y) {
  var tiles = this.tiles;
  var length = tiles.length;
  for (var ii = 0; ii < length; ++ii) {
    var tile = tiles[ii];
    if (tile.x === x && tile.y === y) { return (tile); }
  }
  return (null);
};

/**
 * @param {Tile} tile
 */
Batch.prototype.addTile = function(tile) {
  this.tiles.push(tile);
  this.updateBoundings();
};

/**
 * Push in a new batch operation
 */
function pushTileBatchOperation() {
  var batch = new Batch();
  this.batches.push(batch);
}

/**
 * Refreshes all batch indexes
 */
function refreshBatches() {
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    batch.index = ii;
  }
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
  } else {
    // dont push batch into stack if batch is empty
    if (batch.isEmpty() && !batch.isBackground) {
      this.batches.splice(offset, 1);
      this.refreshBatches();
      return;
    }
    // got a background fill batch, check if we have to push it into the stack
    if (batch.isBackground) {
      var last = this.currentStackOperation();
      // last operation was a background fill too, check if their colors match
      if (last && last.batch.isBackground) {
        if (colorsMatch(batch.bgcolor, last.batch.bgcolor)) { return; }
      }
    }
  }
  this.enqueue({
    batch: batch
  });
  this.updateGlobalBoundings();
  this.refreshBatches();
}

function updateGlobalBoundings() {
  var info = this.getAbsoluteBoundings(this.batches);
  var bounds = this.boundings;
  if (
    info.x !== bounds.x ||
    info.y !== bounds.y ||
    info.w !== bounds.w ||
    info.h !== bounds.h
  ) {
    bounds.x = info.x;
    bounds.y = info.y;
    bounds.w = info.w;
    bounds.h = info.h;
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
 * Clear latest batch operation if empty
 */
function clearLatestTileBatch() {
  if (!this.batches.length) { return; }
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
  this.pushTileBatchOperation();
  this.createBatchTileAt(position.x, position.y, this._fillStyle);
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
  if (otile !== null) {
    if (
      otile.colorMatchesWithTile(color) ||
      otile.colors[otile.cindex][3] === UNSET_TILE_COLOR
    ) { return; }
  }
  var tile = this.createTileAt(x, y);
  tile.colors.unshift(color);
  batch.addTile(tile);
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

/**
 * Resize all background batches to stay smoothy
 * @param {Number} width
 * @param {Number} height
 */
function resizeBackgroundBatches(width, height) {
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    if (!batch.isBackground) { continue; }
    batch.renderBackground(width, height, batch.bgcolor);
  }
}

/**
 * Check whether a point lies inside the used editor area
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
function pointInsideAbsoluteBoundings(x, y) {
  var info = this.getAbsoluteBoundings(this.batches);
  var state = intersectRectangles(
    info.x, info.y, info.w, info.h,
    x, y, 0, 0
  );
  return (state);
}

/**
 * @param {Array} batches
 */
function getAbsoluteBoundings(batches) {
  var px = []; var py = []; var pw = []; var ph = [];
  var sindex = this.sindex;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    if (sindex < ii) { continue; }
    var info = batch.getBoundings();
    px.push(info.x);
    py.push(info.y);
    pw.push(info.x + info.w);
    ph.push(info.y + info.h);
  }
  px.sort(sortAscending);
  py.sort(sortAscending);
  pw.sort(sortAscending);
  ph.sort(sortAscending);
  // calculate rectangle position
  var xx = px[0]|0;
  var yy = py[0]|0;
  // calculate rectangle size
  var idx = pw.length-1;
  var ww = (-xx + pw[idx]);
  var hh = (-yy + ph[idx]);
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
}


var _batch = Object.freeze({
	pushTileBatchOperation: pushTileBatchOperation,
	refreshBatches: refreshBatches,
	finalizeBatchOperation: finalizeBatchOperation,
	updateGlobalBoundings: updateGlobalBoundings,
	getLatestTileBatchOperation: getLatestTileBatchOperation,
	clearLatestTileBatch: clearLatestTileBatch,
	startBatchedDrawing: startBatchedDrawing,
	stopBatchedDrawing: stopBatchedDrawing,
	createBatchTileAt: createBatchTileAt,
	getBatchByTile: getBatchByTile,
	resizeBackgroundBatches: resizeBackgroundBatches,
	pointInsideAbsoluteBoundings: pointInsideAbsoluteBoundings,
	getAbsoluteBoundings: getAbsoluteBoundings
});

/**
 * Sets a batch to background, appends the given bg color
 * as well as generates a camera size based buffered canvas
 * @param {Array} color
 */
function fillBackground(color) {
  var isempty = isGhostColor(color);
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  batch.isBackground = true;
  batch.renderBackground(this.camera.width, this.camera.height, color);
  this.finalizeBatchOperation();
}

/**
 * Fill enclosed tile area color based
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Boolean}
 */
function fillBucketColorBased(x, y, base, color) {
  var this$1 = this;

  // clicked tile color and fill colors match, abort
  if (colorsMatch(color, base)) { return (false); }
  var queue = [{x: x, y: y}];
  var batch = this.getLatestTileBatchOperation();
  for (; queue.length > 0;) {
    var point = queue.pop();
    var x$1 = point.x;
    var y$1 = point.y;
    if (!this$1.pointInsideAbsoluteBoundings(x$1, y$1)) {
      // returning true gets handled as infinite fill detection
      return (true);
    }
    // tile is free, so fill in one here
    if (!batch.getTileColorAt(x$1, y$1)) { batch.createRawTileAt(x$1, y$1, color); }
    var a = batch.getTileAt(x$1+1, y$1) || this$1.getStackRelativeTileColorAt(x$1+1, y$1);
    var b = batch.getTileAt(x$1-1, y$1) || this$1.getStackRelativeTileColorAt(x$1-1, y$1);
    var c = batch.getTileAt(x$1, y$1+1) || this$1.getStackRelativeTileColorAt(x$1, y$1+1);
    var d = batch.getTileAt(x$1, y$1-1) || this$1.getStackRelativeTileColorAt(x$1, y$1-1);
    if (a !== null && colorsMatch(a, base)) { queue.push({x:x$1+1, y:y$1}); }
    if (b !== null && colorsMatch(b, base)) { queue.push({x:x$1-1, y:y$1}); }
    if (c !== null && colorsMatch(c, base)) { queue.push({x:x$1, y:y$1+1}); }
    if (d !== null && colorsMatch(d, base)) { queue.push({x:x$1, y:y$1-1}); }
  }
  return (false);
}

/**
 * Fill enclosed tile area empty tile based
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Boolean}
 */
function fillBucketEmptyTileBased(x, y, color) {
  var this$1 = this;

  var queue = [{x: x, y: y}];
  var batch = this.getLatestTileBatchOperation();
  for (; queue.length > 0;) {
    var point = queue.pop();
    var x$1 = point.x;
    var y$1 = point.y;
    if (!this$1.pointInsideAbsoluteBoundings(x$1, y$1)) {
      // returning true gets handled as infinite fill detection
      return (true);
    }
    // tile is free, so create one here
    if (!batch.getTileColorAt(x$1, y$1)) { batch.createRawTileAt(x$1, y$1, color); }
    var a = this$1.getTileAt(x$1+1, y$1) || this$1.getStackRelativeTileColorAt(x$1+1, y$1);
    var b = this$1.getTileAt(x$1-1, y$1) || this$1.getStackRelativeTileColorAt(x$1-1, y$1);
    var c = this$1.getTileAt(x$1, y$1+1) || this$1.getStackRelativeTileColorAt(x$1, y$1+1);
    var d = this$1.getTileAt(x$1, y$1-1) || this$1.getStackRelativeTileColorAt(x$1, y$1-1);
    if (a === null) { queue.push({x:x$1+1, y:y$1}); }
    if (b === null) { queue.push({x:x$1-1, y:y$1}); }
    if (c === null) { queue.push({x:x$1, y:y$1+1}); }
    if (d === null) { queue.push({x:x$1, y:y$1-1}); }
  }
  return (false);
}

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function fillBucket(x, y, color) {
  // TODO: add method to create temporary batches (e.g. insertRectangle by mouse)
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) { throw new Error("Invalid alpha color!"); }
  this.refreshStack();
  var sIndex = this.sindex;
  // differentiate between empty and colored tiles
  var basecolor = this.getTileColorAt(x, y);
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  var infinite = false;
  // try color based filling
  if (basecolor !== null) {
    infinite = this.fillBucketColorBased(x, y, basecolor, color);
  // empty tile based filling
  } else {
    infinite = this.fillBucketEmptyTileBased(x, y, color);
  }
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
  var bx = batch.x;
  var by = batch.y;
  var buffer = createCanvasBuffer(batch.width, batch.height);
  for (var ii = 0; ii < batch.tiles.length; ++ii) {
    var tile = batch.tiles[ii];
    var x$1 = tile.x - batch.x;
    var y$1 = tile.y - batch.y;
    buffer.fillStyle = tile.getColorAsRgbaString();
    buffer.fillRect(
      x$1, y$1,
      1, 1
    );
  }
  // now draw our staff as a rawbuffer
  batch.createRawBufferAt(buffer, bx, by);
  // free batch tiles to save memory
  batch.tiles = [];
  this.finalizeBatchOperation();
  if (infinite) {
    // remove our recent batch if it didn't got removed yet
    // e.g. infinity got detected later and some batches got drawn
    if (sIndex < this.sindex) {
      this.undo();
      this.refreshStack();
    }
    this.fillBackground(color);
  }
}

/**
 * Inserts stroked arc at given position
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
function strokeArc(x, y, radius, color) {
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertArc(x, y, radius, color);
}

/**
 * Inserts filled arc at given position
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
function insertArc(x1, y1, radius, color) {
  var this$1 = this;

  var x2 = radius;
  var y2 = 0;
  var err = 1 - x2; 
  this.pushTileBatchOperation();
  for (; x2 >= y2;) {
    this$1.createBatchTileAt(x2 + x1, y2 + y1, color);
    this$1.createBatchTileAt(y2 + x1, x2 + y1, color);
    this$1.createBatchTileAt(-x2 + x1, y2 + y1, color);
    this$1.createBatchTileAt(-y2 + x1, x2 + y1, color);
    this$1.createBatchTileAt(-x2 + x1, -y2 + y1, color);
    this$1.createBatchTileAt(-y2 + x1, -x2 + y1, color);
    this$1.createBatchTileAt(x2 + x1, -y2 + y1, color);
    this$1.createBatchTileAt(y2 + x1, -x2 + y1, color);
    y2++;
    if (err <= 0) {
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2--;
      err += 2 * (y2 - x2) + 1;
    }
  }
  this.finalizeBatchOperation();
}

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
  var bx = x1;
  var by = y1;
  for (var yy = 0; yy < height; ++yy) {
    for (var xx = 0; xx < width; ++xx) {
      // ignore inner tiles if rectangle not filled
      if (!filled) {
        if (!(
          (xx === 0 || xx >= width-1) ||
          (yy === 0 || yy >= height-1))
        ) { continue; }
      }
      this$1.createBatchTileAt(bx + xx * dx, by + yy * dy, color);
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
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  batch.createRawBufferAt(ctx, position.x, position.y);
  this.finalizeBatchOperation();
}


var _insert = Object.freeze({
	fillBackground: fillBackground,
	fillBucketColorBased: fillBucketColorBased,
	fillBucketEmptyTileBased: fillBucketEmptyTileBased,
	fillBucket: fillBucket,
	strokeArc: strokeArc,
	insertArc: insertArc,
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
  this.mx = -1;
  this.my = -1;
  this._fillStyle = [255,255,255,1];
  this.camera = instance.camera;
  // stack related
  this.sindex = -1;
  this.stack = [];
  this.boundings = {
    x: 0, y: 0, w: 0, h: 0
  };
};

var prototypeAccessors$1 = { fillStyle: {} };

/**
 * @return {Array}
 */
prototypeAccessors$1.fillStyle.get = function () {
  return (this._fillStyle);
};
/**
 * @param {*} value
 */
prototypeAccessors$1.fillStyle.set = function (value) {
  if (typeof value === "string") {
    this._fillStyle = hexToRgba(value);
  }
  else if (value instanceof Array && value.length === 4) {
    this._fillStyle = value;
  }
  else { throw new Error("Unsupported or invalid color"); }
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

Object.defineProperties( Editor.prototype, prototypeAccessors$1 );

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
  // re-generate background batches
  this.editor.resizeBackgroundBatches(width, height);
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
    if (batch.isBackground) { this$1.drawBackgroundBatch(batch); }
    // draw batched buffer (faster, drawImage)
    else if (batch.isBuffered) { this$1.drawBatchedBuffer(batch); }
    // draw batched tiles (slower, fillRect)
    else { this$1.drawBatchedTiles(batch); }
  }
  // draw currently drawn tiles
  if (this.editor.modes.draw) {
    var length = this.editor.batches.length;
    if (length > 0) { this.drawBatchedTiles(this.editor.batches[length - 1]); }
  }
  this.drawHoveredTile();
  this.drawActiveCursor();
}

function drawActiveCursor() {
  if (!this.cursor) { return; } // no cursor available
  var view = this.cursors[this.cursor];
  if (!view) { return; } // cursor got not loaded yet
  var ctx = this.ctx;
  var drawing = this.editor.modes.draw;
  // cursor gets a bit transparent when user is drawing
  if (drawing === true) {
    ctx.globalCompositeOperation = "exclusion";
  }
  var mx = this.editor.mx;
  var my = this.editor.my;
  var w = 1 + (view.width / 6) | 0;
  var h = 1 + (view.height / 6) | 0;
  var x = ((mx + (w / 2))) | 0;
  var y = ((my + (h / 2))) | 0;
  ctx.drawImage(
    view,
    0, 0,
    view.width, view.height,
    x, y,
    w, h
  );
  if (drawing === true) {
    ctx.globalCompositeOperation = "source-over";
  }
  return;
}

/**
 * @param {Batch} batch
 */
function drawBackgroundBatch(batch) {
  var ctx = this.ctx;
  var buffer = batch.bgbuffer;
  var width = buffer.width | 0;
  var height = buffer.height | 0;
  ctx.drawImage(
    buffer,
    0, 0,
    width, height,
    0, 0,
    width, height
  );
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
    var x = ((cx + ((tile.x * TILE_SIZE) * scale))) | 0;
    var y = ((cy + ((tile.y * TILE_SIZE) * scale))) | 0;
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
  var bx = batch.x * TILE_SIZE;
  var by = batch.y * TILE_SIZE;
  var x = (cx + (bx * scale)) | 0;
  var y = (cy + (by * scale)) | 0;
  var width = (batch.width * TILE_SIZE) | 0;
  var height = (batch.height * TILE_SIZE) | 0;
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
  var rx = relative.x * TILE_SIZE;
  var ry = relative.y * TILE_SIZE;
  var x = ((cx + GRID_LINE_WIDTH/2) + (rx * scale)) | 0;
  var y = ((cy + GRID_LINE_WIDTH/2) + (ry * scale)) | 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x, y, ww, hh);
}

function renderStats() {
  // render mouse hovered color
  var mx = this.editor.mx;
  var my = this.editor.my;
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x;
  var ry = relative.y;
  var color = this.editor.getStackRelativeTileColorAt(rx, ry);
  this.ctx.fillStyle = "#ffffff";
  this.ctx.fillText(("x:" + rx + ", y:" + ry), 16, 32);
  if (color !== null) {
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    this.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    this.ctx.fillRect(
      6, 42, 8, 8
    );
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText((r + "," + g + "," + b + "," + a), 20, 48);
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
	drawActiveCursor: drawActiveCursor,
	drawBackgroundBatch: drawBackgroundBatch,
	drawBatchedTiles: drawBatchedTiles,
	drawBatchedBuffer: drawBatchedBuffer,
	drawHoveredTile: drawHoveredTile,
	renderStats: renderStats,
	renderFPS: renderFPS,
	generateBackground: generateBackground
});

/**
 * @class Poxi
 */
var Poxi = function Poxi(obj) {
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
  this.cursor = null;
  this.cursors = {};
  this.createView();
  // apply sizing
  if (obj.width >= 0 && obj.height >= 0) {
    this.resize(obj.width, obj.height);
  } else {
    this.resize(view.width, view.height);
  }
  this.init();
};

var prototypeAccessors = { activeCursor: {} };

Poxi.prototype.init = function init () {
  this.renderLoop();
};

Poxi.prototype.createView = function createView () {
  var buffer = createCanvasBuffer(this.width, this.height);
  this.ctx = buffer;
  this.view = buffer.canvas;
};

Poxi.prototype.renderLoop = function renderLoop () {
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
Poxi.prototype.isViewElement = function isViewElement (el) {
  return (
    el && el instanceof HTMLCanvasElement
  );
};

/**
 * Event emitter
 * @param {String} kind
 * @param {Function} fn
 */
Poxi.prototype.on = function on (kind, fn) {
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
Poxi.prototype.processEmitter = function processEmitter (hash, fn) {
  // begin drawing as soon as we got something to do there
  if (this.frames === 0 && hash === DRAW_HASH) {
    this.states.paused = false;
  }
};

/**
 * Export the current view to base64 encoded png string
 * @return {String}
 */
Poxi.prototype.exportAsDataUrl = function exportAsDataUrl () {
  var editor = this.editor;
  var batches = editor.batches;
  var bounds = editor.boundings;
  var rx = bounds.x;
  var ry = bounds.y;
  var width = bounds.w;
  var height = bounds.h;
  var ctx = createCanvasBuffer(width, height);
  var view = ctx.canvas;
  var sIndex = editor.sindex;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    // ignore future batches
    if (sIndex < ii) { continue; }
    // background
    if (batch.isBackground) {
      ctx.fillStyle = colorToRgbaString(batch.bgcolor);
      ctx.fillRect(
        0, 0,
        view.width, view.height
      );
      continue;
    }
    // buffer
    if (batch.isBuffered) {
      ctx.drawImage(
        batch.buffer.view,
        (batch.x - rx) | 0, (batch.y - ry) | 0,
        batch.width | 0, batch.height | 0
      );
      continue;
    }
    // tiles
    if (batch.tiles.length) {
      var tiles = batch.tiles;
      for (var ii$1 = 0; ii$1 < tiles.length; ++ii$1) {
        var tile = tiles[ii$1];
        var x = (tile.x - rx) | 0;
        var y = (tile.y - ry) | 0;
        var color = colorToRgbaString(tile.colors[tile.cindex]);
        ctx.fillStyle = color;
        ctx.fillRect(
          x, y,
          1, 1
        );
      }
      continue;
    }
  }
  return (view.toDataURL());
};

/**
 * @param {String} kind
 * @param {String} path
 */
Poxi.prototype.addCursor = function addCursor (kind, path) {
    var this$1 = this;

  var cursor = this.cursor;
  // reserve property, so we have access
  // to it even before the image got loaded
  this.cursors[kind] = null;
  loadImage(path, function (img) {
    this$1.cursors[kind] = img;
  });
};

/**
 * Set active cursor
 * @param {String} kind
 */
prototypeAccessors.activeCursor.set = function (kind) {
  if (this.cursors[kind] !== void 0) {
    this.cursor = kind;
  } else {
    this.cursor = null;
  }
};

Object.defineProperties( Poxi.prototype, prototypeAccessors );

inherit(Poxi, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Poxi = Poxi;
} else {
  throw new Error("Please run Poxi inside a browser");
}

})));
