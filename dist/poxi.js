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


/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
}

/**
 * Derivative of alphaByteToRgbAlpha
 * @param {Number} a
 * @return {Number}
 */


/**
 * Convert rgba to rgba byte color
 * @param {Array} rgba
 * @return {Array}
 */
function rgbaToBytes(rgba) {
  var r = rgba[0] / 255;
  var g = rgba[1] / 255;
  var b = rgba[2] / 255;
  var a = rgba[3];
  return ([r, g, b, a]);
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
 * @param {String} hex
 * @return {Array}
 */
function hexToRgba(hex) {
  var r = parseInt(hex.substring(1,3), 16);
  var g = parseInt(hex.substring(3,5), 16);
  var b = parseInt(hex.substring(5,7), 16);
  return ([r,g,b,1]);
}

/**
 * @param {Array} rgba
 * @return {String}
 */
function rgbaToHex(rgba) {
  var r = rgba[0];
  var g = rgba[1];
  var b = rgba[2];
  var a = rgba[3];
  return (
    "#" +
    ("0" + parseInt(r, 10).toString(16)).slice(-2) +
    ("0" + parseInt(g, 10).toString(16)).slice(-2) +
    ("0" + parseInt(b, 10).toString(16)).slice(-2)
  );
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


/**
 * Creates and returns an webgl context
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLRenderingContext}
 */
function getWGLContext(canvas) {
  if (!WGL_SUPPORTED) {
    throw new Error("Your browser doesn't support WebGL.");
  }
  var opts = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    stencil: false,
    preserveDrawingBuffer: false
  };
  return (
    canvas.getContext("webgl", opts) ||
    canvas.getContext("experimental-webgl", opts)
  );
}

// default view size
var DEFAULT_WIDTH = 480;
var DEFAULT_HEIGHT = 320;
// default grid hidden or not
var DEFAULT_GRID_HIDDEN = false;

var TILE_SIZE = 8;
var MIN_SCALE = 0.1;
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
var HIDE_GRID = 0.5;
var GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
var ZOOM_SPEED = 15;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */
var BATCH_BUFFER_SIZE = {
  MIN_W: 1,
  MIN_H: 1,
  MIN_L: 1
};

var DRAW_HASH = hashFromString("draw");

// Maximum allowed items inside stack
var STACK_LIMIT = 255;

// WebGL texture limit
var WGL_TEXTURE_LIMIT = 1e3;

// WebGL supported or not
var WGL_SUPPORTED = (
  typeof WebGLRenderingContext !== "undefined"
);

// WebAssembly supported or not

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
Tile.prototype.colorMatchesWithTile = function(color) {
  return (
    colorsMatch(this.colors[this.cindex], color)
  );
};

/**
 * @return {Array}
 */
Tile.prototype.getColorAsRgbaBytes = function() {
  return (rgbaToBytes(this.colors[this.cindex]));
};

/**
 * @return {String}
 */
Tile.prototype.getColorAsRgbaString = function() {
  var c = this.colors[this.cindex];
  var r = c[0];
  var g = c[1];
  var b = c[2];
  var a = c[3];
  return (
    ("rgba(" + r + "," + g + "," + b + "," + a + ")")
  );
};

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
  this.s = MIN_SCALE + 1.0;
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
  var x = (dir * (ZOOM_SPEED / 1e2)) * zoomScale(this.s);
  var oscale = this.s;
  if (this.s + x <= MIN_SCALE) { this.s = MIN_SCALE; }
  else if (this.s + x >= MAX_SCALE) { this.s = MAX_SCALE; }
  else { this.s += x; }
  this.s = roundTo(this.s, MAGIC_SCALE);
  if (this.s >= (MAX_SCALE - 1) + .25) { this.s = (MAX_SCALE - 1) + .25; }
  this.x -= (this.lx) * (zoomScale(this.s) - zoomScale(oscale));
  this.y -= (this.ly) * (zoomScale(this.s) - zoomScale(oscale));
  this.instance.redraw();
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
  this.instance.redraw();
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
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function fillBucket(x, y, color) {
  // TODO: add method to create temporary batches (e.g. insertRectangle by mouse)
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) { throw new Error("Invalid alpha color!"); }
  // differentiate between empty and colored tiles
  var base = this.getStackRelativeTileColorAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) { return; }
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  // we now need the most recent boundings
  this.updateGlobalBoundings();
  // save the current stack index
  var sindex = this.sindex;
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  // flood fill
  var result = this.binaryFloodFill(x, y, base, color);
  // convert buffer into batched raw buffer
  batch.createRawBufferAt(result.buffer, result.x, result.y);
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
  // make sure we only create a raw buffer if we got tiles to draw onto
  if (batch.tiles.length) { this.batchTilesToRawBuffer(batch, color); }
  // finalizing a batch also deletes the batch if we didn't change anything
  this.finalizeBatchOperation();
  // infinity got detected, but some batches could be drawn before, so clear them first
  return;
}

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive" cells at the grid,
 * then we take the boundings of the used/filled area of our grid and crop out
 * the relevant part. Then we convert the filled grid area into a raw buffer
 * TODO: Fails with negative coordinates and infinity
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Object}
 */
function binaryFloodFill(x, y, base, color) {
  var this$1 = this;

  var bounds = this.boundings;
  var bx = bounds.x;
  var by = bounds.y;
  var gw = bounds.w;
  var gh = bounds.h;
  var isEmpty = base[3] === 0;
  var gridl = gw * gh;

  // allocate and do a basic fill onto the grid
  var grid = new Uint8ClampedArray(gw * gh);
  for (var ii = 0; ii < gridl; ++ii) {
    var xx = ii % gw;
    var yy = (ii / gw) | 0;
    var color$1 = this$1.getTileColorAt(bx + xx, by + yy);
    if (isEmpty) {
      if (color$1 !== null) { continue; }
    } else {
      if (color$1 === null) { continue; }
      if (!(base[0] === color$1[0] && base[1] === color$1[1] && base[2] === color$1[2])) { continue; }
    }
    // fill tiles with 1's if we got a color match
    grid[yy * gw + xx] = 1;
  }

  // trace connected tiles by [x,y]=2
  var queue = [{x: x, y: y}];
  while (queue.length > 0) {
    var point = queue.pop();
    var x$1 = point.x;
    var y$1 = point.y;
    var idx = y$1 * gw + x$1;
    // detected infinite filling, skip and return true=^infinite
    //if (!this.pointInsideAbsoluteBoundings(x, y)) return (true);
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) { grid[idx] = 2; }
    var nn = (y$1-1) * gw + x$1;
    var ee = y$1 * gw + (x$1+1);
    var ss = (y$1+1) * gw + x$1;
    var ww$1 = y$1 * gw + (x$1-1);
    if (nn < gridl && grid[nn] === 1) { queue.push({x: x$1, y:y$1-1}); }
    if (ee < gridl && grid[ee] === 1) { queue.push({x:x$1+1, y: y$1}); }
    if (ss < gridl && grid[ss] === 1) { queue.push({x: x$1, y:y$1+1}); }
    if (ww$1 < gridl && grid[ww$1] === 1) { queue.push({x:x$1-1, y: y$1}); }
  }

  // calculate crop factor
  var px = [];
  var py = [];
  for (var ii$1 = 0, length = grid.length; ii$1 < length; ++ii$1) {
    var xx$1 = ii$1 % gw;
    var yy$1 = (ii$1 / gw) | 0;
    if (grid[ii$1] !== 2) { continue; }
    px.push(xx$1);
    py.push(yy$1);
  }
  px.sort(sortAscending);
  py.sort(sortAscending);
  // calculate position
  var sx = px[0] | 0;
  var sy = py[0] | 0;
  // calculate rectangle size
  var ww = ((px[px.length - 1] - sx) | 0) + 1;
  var hh = ((py[py.length - 1] - sy) | 0) + 1;

  // convert cropped area into raw buffer
  var buffer = createCanvasBuffer(ww, hh);
  buffer.fillStyle = colorToRgbaString(color);
  for (var ii$2 = 0; ii$2 < ww * hh; ++ii$2) {
    var xx$2 = ii$2 % ww;
    var yy$2 = (ii$2 / ww) | 0;
    var gx = sx + xx$2;
    var gy = sy + yy$2;
    if (grid[gy * gw + gx] !== 2) { continue; }
    buffer.fillRect(
      xx$2, yy$2, 1, 1
    );
  }

  // finally free things from memory
  grid = null;
  px = null; py = null;

  return ({
    x: sx,
    y: sy,
    width: ww,
    height: hh,
    buffer: buffer
  });
}

/**
 * Sets a batch to background, appends the given bg color
 * and generates a camera width and height based buffered canvas
 * @param {Array} color
 */
function fillBackground(color) {
  var isempty = isGhostColor(color);
  this.pushTileBatchOperation();
  var batch = this.getLatestTileBatchOperation();
  batch.isBackground = true;
  batch.renderBackground(this.camera.width, this.camera.height, color);
  batch.updateBoundings();
  this.finalizeBatchOperation();
}


var _fill = Object.freeze({
	fillBucket: fillBucket,
	binaryFloodFill: binaryFloodFill,
	fillBackground: fillBackground
});

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
  // free the stack if necessary
  if (this.stack.length >= STACK_LIMIT / 4) {
    //throw new Error("Stack overflow!");
  }
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
  this.updateGlobalBoundings();
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
    var batch = this$1.batches.splice(from + ii - 1, 1)[0];
    // free batch from memory
    if (batch.buffer.texture instanceof WebGLTexture) {
      batch.tiles = [];
      batch.buffer.view = null;
      batch.buffer.data = null;
      batch.buffer.context = null;
      this$1.renderer.destroyTexture(batch.buffer.texture);
      batch.buffer.texture = null;
      batch.buffer = null;
    }
    batch = null;
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
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var idx = batches.length - 1 - ii; // reversed
    var batch = batches[idx].tiles;
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        return (tile);
      }
    }
  }
  return (null);
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
  var sindex = this.sindex;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var idx = batches.length - 1 - ii; // reversed
    var batch = batches[idx].tiles;
    if (sindex - idx < 0) { continue; }
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        return (tile);
      }
    }
  }
  return (null);
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
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var idx = batches.length - 1 - ii; // reversed
    var batch = batches[idx];
    var color = batch.getTileColorAt(x, y);
    if (color !== null) { return (color); }
  }
  return (null);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getStackRelativeTileColorAt(x, y) {
  var sindex = this.sindex;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var idx = batches.length - 1 - ii; // reversed
    var batch = batches[idx];
    if (sindex - idx < 0) { continue; }
    var color = batch.getTileColorAt(x, y);
    if (color !== null) { return (color); }
  }
  return (null);
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
	getRandomRgbaColors: getRandomRgbaColors,
	getTileColorAt: getTileColorAt,
	getStackRelativeTileColorAt: getStackRelativeTileColorAt,
	getStackRelativeTileColorByMouseOffset: getStackRelativeTileColorByMouseOffset
});

/**
 * @class Texture
 */
var Texture = function Texture(buffer) {
  var view = buffer.canvas;
  this.view = view;
  this.texture = null;
  this.context = buffer;
  this.data = buffer.getImageData(0, 0, view.width, view.height).data;
};

/**
 * @param {CanvasRenderingContext2D}
 * @param {Number} x
 * @param {Number} y
 */
function createRawBufferAt(ctx, x, y) {
  var view = ctx.canvas;
  this.x = x;
  this.y = y;
  this.width = view.width;
  this.height = view.height;
  this.isBuffered = true;
  this.isRawBuffer = true;
  this.isBackground = false;
  this.buffer = new Texture(ctx);
}

/**
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRawColorAt(x, y) {
  // normalize our point
  var xx = x - this.x;
  var yy = y - this.y;
  // abort if point isn't inside our buffer boundings
  if (
    (xx < 0 || xx >= this.width) ||
    (yy < 0 || yy >= this.height)
  ) { return (null); }
  // now extract the data
  var data = this.buffer.data;
  // imagedata array is 1d
  var idx = (yy * this.width + xx) * 4;
  // get each color value
  var r = data[idx + 0];
  var g = data[idx + 1];
  var b = data[idx + 2];
  var a = data[idx + 3];
  var color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) { return (null); }
  // finally return the color array
  return (color);
}


var _raw = Object.freeze({
	createRawBufferAt: createRawBufferAt,
	getRawColorAt: getRawColorAt
});

/**
 * Determine if we should buffer the batch or not
 * Buffering a batch takes only in place, when drawImage is likely
 * faster than the (faster for single tiles) fillRect method
 * @return {Boolean}
 */
function exceedsBoundings() {
  if (this.tiles.length >= BATCH_BUFFER_SIZE.MIN_L) { return (true); }
  var size = this.getBoundings();
  return (
    size.w - 1 >= BATCH_BUFFER_SIZE.MIN_W ||
    size.h - 1 >= BATCH_BUFFER_SIZE.MIN_H
  );
}

/**
 * Check if points lies inside the batch
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
function pointInsideBoundings(x, y) {
  if (this.isBackground) { return (true); }
  var state = intersectRectangles(
    this.x, this.y, this.width, this.height,
    x, y, 0, 0
  );
  return (state);
}

/**
 * Updates the batch's relative position and size
 * @return {Void}
 */
function updateBoundings() {
  // dont calculate sizes of raw buffers
  if (this.isRawBuffer) { return; }
  // background boundings are infinite
  if (this.isBackground) {
    this.x = this.y = this.width = this.height = Infinity;
    return;
  }
  var info = this.getBoundings();
  this.x = info.x;
  this.y = info.y;
  this.width = info.w;
  this.height = info.h;
  return;
}

/**
 * Calculate cropped size of given batch
 * @return {Object}
 */
function getBoundings() {
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
  var xx = px[0] | 0;
  var yy = py[0] | 0;
  // calculate rectangle size
  var ww = ((px[idx] - px[0]) | 0) + 1;
  var hh = ((py[idx] - py[0]) | 0) + 1;
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
}


var _bounds = Object.freeze({
	exceedsBoundings: exceedsBoundings,
	pointInsideBoundings: pointInsideBoundings,
	updateBoundings: updateBoundings,
	getBoundings: getBoundings
});

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
  var tiles = this.tiles;
  var length = tiles.length;
  for (var ii = 0; ii < length; ++ii) {
    var tile = tiles[ii];
    if (tile.x === x && tile.y === y) { return (tile); }
  }
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
  if (this.isEmpty()) { return (null); }
  // use image data for raw buffers
  if (this.isRawBuffer) {
    var color = this.getRawColorAt(x, y);
    if (color !== null) { return (color); }
  }
  // return background color if batch is a filled background
  if (this.isBackground) { return (this.bgcolor); }
  // search tile based
  var tile = this.getTileAt(x, y);
  if (tile !== null) { return (tile.colors[tile.cindex]); }
  return (null);
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

inherit(Batch, _raw);
inherit(Batch, _bounds);

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
 * @return {Void}
 */
function finalizeBatchOperation() {
  var offset = this.batches.length - 1;
  var batch = this.batches[offset];
  if (batch.exceedsBoundings() && !batch.isRawBuffer) {
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
      var last = this.batches[this.batches.length - 2];
      // last operation was a background fill too, check if their colors match
      if (last && last.isBackground) {
        if (colorsMatch(batch.bgcolor, last.bgcolor)) { return; }
      }
    }
  }
  // Auto generate texture out of buffer
  if (batch.buffer !== null) {
    batch.buffer.texture = this.instance.renderer.bufferTexture(String(uid()), batch.buffer.view, false);
  }
  this.enqueue({
    batch: batch
  });
  this.refreshBatches();
  this.refreshStack();
  return;
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
 * @return {Void}
 */
function clearLatestTileBatch() {
  if (!this.batches.length) { return; }
  var batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (!batch.tiles.length) {
    var offset = this.batches.length - 1;
    this.batches.splice(offset, 1);
  }
  return;
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
 * @return {Void}
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
  return;
}

/**
 * Get batch by the given tile
 * @param {Tile} tile
 * @return {Batch}
 */
function getBatchByTile(tile) {
  var id = tile.id;
  var batches = this.batches;
  var x = tile.x;
  var y = tile.y;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    var tiles = batch.tiles;
    for (var jj = 0; jj < tiles.length; ++jj) {
      var tile$1 = tiles[jj];
      if (tile$1.id === id) { return (batch); }
    }
  }
  return null;
}

/**
 * Get batch by the given tile
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
function getStackRelativeBatchByPoint(x, y) {
  var batches = this.batches;
  var sindex = this.sindex;
  for (var ii = 0; ii < batches.length; ++ii) {
    var idx = batches.length - 1 - ii; // reversed
    if (sindex < idx) { continue; }
    var batch = batches[idx];
    if (batch.isBackground) { return (batch); }
    if (batch.pointInsideBoundings(x, y)) { return (batch); }
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
  var bounds = this.boundings;
  var state = intersectRectangles(
    bounds.x, bounds.y, bounds.w, bounds.h,
    x, y, 0, 0
  );
  return (state);
}

/**
 * @param {Array} batches
 * @return {Object}
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

/**
 * Updates the global boundings of our stage, so we
 * always have access to our absolute stage boundings
 */
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
 * Check if given batch is inside camera view
 * @param {Batch} batch
 * @return {Boolean}
 */
function isBatchInsideView(batch) {
  var camera = this.camera;
  var scale = camera.s;
  var cw = camera.width;
  var ch = camera.height;
  var cx = camera.x;
  var cy = camera.y;
  var w = (batch.width * TILE_SIZE) * scale;
  var h = (batch.height * TILE_SIZE) * scale;
  var x = ((batch.x * TILE_SIZE) * scale) + cx;
  var y = ((batch.y * TILE_SIZE) * scale) + cy;
  // backgrounds are always visible
  if (batch.isBackground) { return (true); }
  return (
    (x + w >= 0 && x <= cw) &&
    (y + h >= 0 && y <= ch)
  );
}


var _batch = Object.freeze({
	pushTileBatchOperation: pushTileBatchOperation,
	refreshBatches: refreshBatches,
	finalizeBatchOperation: finalizeBatchOperation,
	getLatestTileBatchOperation: getLatestTileBatchOperation,
	clearLatestTileBatch: clearLatestTileBatch,
	startBatchedDrawing: startBatchedDrawing,
	stopBatchedDrawing: stopBatchedDrawing,
	createBatchTileAt: createBatchTileAt,
	getBatchByTile: getBatchByTile,
	getStackRelativeBatchByPoint: getStackRelativeBatchByPoint,
	resizeBackgroundBatches: resizeBackgroundBatches,
	pointInsideAbsoluteBoundings: pointInsideAbsoluteBoundings,
	getAbsoluteBoundings: getAbsoluteBoundings,
	updateGlobalBoundings: updateGlobalBoundings,
	isBatchInsideView: isBatchInsideView
});

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
  this.renderer = instance.renderer;
  this.modes = {
    draw: false,
    selectAll: false
  };
  this.batches = [];
  // mouse position, negative to be hidden initially
  this.mx = -0;
  this.my = -0;
  this._fillStyle = [255,255,255,1];
  this.camera = instance.camera;
  // stack related
  this.sindex = -1;
  this.stack = [];
  this.boundings = {
    x: 0, y: 0, w: 0, h: 0
  };
};

var prototypeAccessors = { fillStyle: {} };

/**
 * @return {Array}
 */
prototypeAccessors.fillStyle.get = function () {
  return (this._fillStyle);
};
/**
 * @param {*} value
 */
prototypeAccessors.fillStyle.set = function (value) {
  if (typeof value === "string") {
    if (value[0] === "#") {
      this._fillStyle = hexToRgba(value);
    } else {
      throw new Error("Invalid or unsupported color format " + String(value));
    }
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

Object.defineProperties( Editor.prototype, prototypeAccessors );

inherit(Editor, _fill);
inherit(Editor, _stack);
inherit(Editor, _tiles);
inherit(Editor, _batch);
inherit(Editor, _insert);
inherit(Editor, _transform);

/**
 * Clears the context
 */
function clear() {
  var gl = this.ctx;
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function updateViewport() {
  var gl = this.ctx;
  var program = this.psprite;
  gl.uniform2f(
    gl.getUniformLocation(program, "uScale"),
    this.width, this.height
  );
}

/**
 * Draw a texture
 * @param {Texture} tex
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
function drawImage$1(tex, dx, dy, dw, dh) {
  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  var gl = this.ctx;
  var program = this.psprite;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );

  var pos = this.vertices.position;
  for (var ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  this.setAttribute(program, this.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

}

/**
 * Draw a rectangle
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 * @param {Array} color
 */
function drawRectangle(dx, dy, dw, dh, color) {
  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  var gl = this.ctx;
  var program = this.psprite;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 1);

  var pos = this.vertices.position;
  for (var ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.empty);
  gl.uniform4f(
    gl.getUniformLocation(program, "vColor"),
    color[0], color[1], color[2], color[3]
  );
  this.setAttribute(program, this.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 0);

}

/**
 * Resize
 */
function resize$1() {
  var gl = this.ctx;
  var width = this.camera.width;
  var height = this.camera.height;
  var program = this.psprite;
  var view = this.view;
  this.width = width;
  this.height = height;
  view.width = width;
  view.height = height;
  gl.viewport(0, 0, width, height);
  gl.enable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}


var _draw = Object.freeze({
	clear: clear,
	updateViewport: updateViewport,
	drawImage: drawImage$1,
	drawRectangle: drawRectangle,
	resize: resize$1
});

var SPRITE_VERTEX = "\n  precision lowp float;\n  uniform vec2 uScale;\n  uniform vec2 uObjScale;\n  attribute vec2 aObjCen;\n  attribute float aIdx;\n  varying vec2 uv;\n  void main(void) {\n    if (aIdx == 0.0) {\n      uv = vec2(0.0,0.0);\n    } else if (aIdx == 1.0) {\n      uv = vec2(1.0,0.0);\n    } else if (aIdx == 2.0) {\n      uv = vec2(0.0,1.0);\n    } else {\n      uv = vec2(1.0,1.0);\n    }\n    gl_Position = vec4(\n      -1.0 + 2.0 * (aObjCen.x + uObjScale.x * (-0.5 + uv.x)) / uScale.x,\n      1.0 - 2.0 * (aObjCen.y + uObjScale.y * (-0.5 + uv.y)) / uScale.y,\n      0.0, 1.0\n    );\n  }\n";

var SPRITE_FRAGMENT = "\n  precision lowp float;\n  uniform sampler2D uSampler;\n  varying vec2 uv;\n  uniform int isRect;\n  uniform vec4 vColor;\n  void main(void) {\n    if (isRect == 0) {\n      gl_FragColor = texture2D(uSampler, uv);\n    } else {\n      gl_FragColor = vColor + texture2D(uSampler, uv);\n    }\n    if (gl_FragColor.a < 0.1) discard;\n  }\n";

/**
 * @param {HTMLCanvasElement} view 
 */
function setup(view) {
  this.view = view;
  var gl = getWGLContext(this.view);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  this.ctx = gl;
  this.buildShaders();
  this.empty = this.createEmptyTexture();
  this.resize();
}

function buildShaders() {
  this.psprite = this.createSpriteProgram();
}

/**
 * @return {WebGLTexture}
 */
function createEmptyTexture() {
  var gl = this.ctx;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0])
  );
  return (texture);
}

/**
 * @return {WebGLProgram}
 */
function createSpriteProgram() {
  var gl = this.ctx;
  var size = WGL_TEXTURE_LIMIT;
  var program = gl.createProgram();
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);

  this.compileShader(vshader, SPRITE_VERTEX);
  this.compileShader(fshader, SPRITE_FRAGMENT);

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);

  var buffers = this.buffers;
  var vertices = this.vertices;
  var idxs = vertices.idx = new Float32Array(size * 6);
  vertices.position = new Float32Array(size * 12);

  buffers.idx = gl.createBuffer();
  buffers.position = gl.createBuffer();
  for (var ii = 0; ii < size; ii++) {
    idxs[6 * ii + 0] = 0;
    idxs[6 * ii + 1] = 1;
    idxs[6 * ii + 2] = 2;
    idxs[6 * ii + 3] = 1;
    idxs[6 * ii + 4] = 2;
    idxs[6 * ii + 5] = 3;
  }

  this.setAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return (program);
}

function compileShader(shader, shader_src) {
  var gl = this.ctx;
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
}

function setAttribute(program, buffer, name, size, values) {
  var gl = this.ctx;
  var attribute = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);
  }
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
}


var _setup = Object.freeze({
	setup: setup,
	buildShaders: buildShaders,
	createEmptyTexture: createEmptyTexture,
	createSpriteProgram: createSpriteProgram,
	compileShader: compileShader,
	setAttribute: setAttribute
});

/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @param {Boolean} linear
 * @return {WebGLTexture}
 */
function bufferTexture(name, canvas, linear) {
  var gl = this.ctx;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  if (linear === true) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (this.textures[name] === void 0) {
    this.textures[name] = texture;
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  return (this.textures[name]);
}

/**
 * Lookup for the texture inside our texture pool and free it from memory
 * @param {WebGLTexture} texture
 */
function destroyTexture(texture) {
  var gl = this.ctx;
  var textures = this.textures;
  for (var key in textures) {
    var txt = textures[key];
    if (txt !== texture) { continue; }
    gl.deleteTexture(txt);
    delete textures[key];
    txt = null;
    break;
  }
}

/**
 * @param {WebGLTexture} texture
 * @param {HTMLCanvasElement} canvas 
 */
function updateTexture(texture, canvas) {
  var gl = this.ctx;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
}


var _buffer = Object.freeze({
	bufferTexture: bufferTexture,
	destroyTexture: destroyTexture,
	updateTexture: updateTexture
});

/**
 * @class WGLRenderer
 */
var WGLRenderer = function WGLRenderer(instance) {
  // View to render on
  this.view = null;
  // Wgl context
  this.ctx = null;
  // empty texture
  this.empty = null;
  // Clear colors
  this.colors = [0, 0, 0, 1];
  // View sizes
  this.width = 0;
  this.height = 0;
  // Vertice cache
  this.vertices = {
    idx: null,
    position: null,
    rotation: null
  };
  // Buffer cache
  this.buffers = {
    idxs: null,
    position: null,
    rotation: null
  };
  // Texture pool
  this.textures = {};
  // Save poxi instance
  this.instance = instance;
  // Save poxi camera
  this.camera = this.instance.camera;
};

inherit(WGLRenderer, _draw);
inherit(WGLRenderer, _setup);
inherit(WGLRenderer, _buffer);

/**
 * @param {Number} width
 * @param {Number} height
 */
function resize$2(width, height) {
  if (width >= 0) { this.width = width; }
  if (height >= 0) { this.height = height; }
  this.view.width = width;
  this.view.height = height;
  this.camera.resize(width, height);
  // re-generate our bg
  this.bg = this.createBackgroundBuffer();
  // generate our grid
  this.grid = this.createGridBuffer();
  // re-generate background batches
  this.editor.resizeBackgroundBatches(width, height);
  this.renderer.resize();
  this.redraw();
}

function redraw() {
  if (this.showGrid()) {
    this.redrawGridBuffer();
  }
  this.clear();
  this.render();
}

function clear$1() {
  this.renderer.clear();
}

function render() {
  this.renderer.ctx.useProgram(this.renderer.psprite);
  this.renderer.updateViewport();
  this.renderBackground();
  if (this.showGrid()) { this.renderGrid(); }
  this.renderBatches();
  this.drawHoveredTile();
  //this.renderStats();
}

function renderBackground() {
  var width = this.camera.width;
  var height = this.camera.height;
  this.renderer.drawImage(
    this.bg,
    0, 0,
    width, height
  );
}

function renderGrid() {
  var width = this.camera.width;
  var height = this.camera.height;
  this.renderer.drawImage(
    this.gridTexture,
    0, 0,
    width, height
  );
}

function renderBatches() {
  var this$1 = this;

  var sindex = this.editor.sindex;
  var batches = this.editor.stack;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii].batch;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - ii < 0) { continue; }
    if (!this$1.editor.isBatchInsideView(batch)) { continue; }
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
}

/**
 * @param {Batch} batch
 */
function drawBackgroundBatch(batch) {
  var ctx = this.ctx;
  var buffer = batch.bgbuffer;
  var width = buffer.width | 0;
  var height = buffer.height | 0;
  this.renderer.drawImage(
    batch.buffer.texture,
    0, 0,
    width, height
  );
}

/**
 * @param {Batch} batch
 */
function drawBatchedTiles(batch) {
  var this$1 = this;

  var cx = this.camera.x | 0;
  var cy = this.camera.y | 0;
  var cs = roundTo(this.camera.s, MAGIC_SCALE);
  var ww = (TILE_SIZE * cs) | 0;
  var hh = (TILE_SIZE * cs) | 0;
  var tiles = batch.tiles;
  for (var jj = 0; jj < tiles.length; ++jj) {
    var tile = tiles[jj];
    var x = ((cx + ((tile.x * TILE_SIZE) * cs))) | 0;
    var y = ((cy + ((tile.y * TILE_SIZE) * cs))) | 0;
    var color = tile.colors[tile.cindex];
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    this$1.renderer.drawRectangle(x, y, ww, hh, tile.getColorAsRgbaBytes());
  }
}

/**
 * @param {Batch} batch
 */
function drawBatchedBuffer(batch) {
  var cx = this.camera.x | 0;
  var cy = this.camera.y | 0;
  var cs = roundTo(this.camera.s, MAGIC_SCALE);
  var bx = batch.x * TILE_SIZE;
  var by = batch.y * TILE_SIZE;
  var x = (cx + (bx * cs)) | 0;
  var y = (cy + (by * cs)) | 0;
  var ww = ((batch.width * TILE_SIZE) * cs) | 0;
  var hh = ((batch.height * TILE_SIZE) * cs) | 0;
  this.renderer.drawImage(
    batch.buffer.texture,
    x, y,
    ww, hh
  );
}

function drawHoveredTile() {
  var cx = this.camera.x | 0;
  var cy = this.camera.y | 0;
  var cs = roundTo(this.camera.s, MAGIC_SCALE);
  var ww = (TILE_SIZE * cs) | 0;
  var hh = (TILE_SIZE * cs) | 0;
  // apply empty tile hover color
  var mx = this.editor.mx;
  var my = this.editor.my;
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x * TILE_SIZE;
  var ry = relative.y * TILE_SIZE;
  var x = ((cx + GRID_LINE_WIDTH/2) + (rx * cs)) | 0;
  var y = ((cy + GRID_LINE_WIDTH/2) + (ry * cs)) | 0;
  if (mx !== -0 && my !== -0) {
    this.renderer.drawRectangle(
      x, y,
      ww, hh,
      [255, 255, 255, 0.2]
    );
  }
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


var _render = Object.freeze({
	resize: resize$2,
	redraw: redraw,
	clear: clear$1,
	render: render,
	renderBackground: renderBackground,
	renderGrid: renderGrid,
	renderBatches: renderBatches,
	drawBackgroundBatch: drawBackgroundBatch,
	drawBatchedTiles: drawBatchedTiles,
	drawBatchedBuffer: drawBatchedBuffer,
	drawHoveredTile: drawHoveredTile,
	renderStats: renderStats,
	renderFPS: renderFPS
});

/**
 * @return {CanvasRenderingContext2D}
 */
function createGridBuffer() {
  var cw = this.camera.width;
  var ch = this.camera.height;
  var buffer = createCanvasBuffer(cw, ch);
  if (this.grid !== null) {
    this.grid = null;
    this.renderer.destroyTexture(this.gridTexture);
  }
  this.grid = buffer;
  this.gridTexture = this.renderer.bufferTexture("grid", buffer.canvas, true);
  this.redrawGridBuffer();
  return (buffer);
}

function redrawGridBuffer() {
  var buffer = this.grid;
  var texture = this.gridTexture;
  var cs = roundTo(this.camera.s, MAGIC_SCALE);
  var size = (TILE_SIZE * this.camera.s) | 0;
  var cx = this.camera.x | 0;
  var cy = this.camera.y | 0;
  var cw = this.camera.width;
  var ch = this.camera.height;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (var xx = (cx%size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  }
  for (var yy = (cy%size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  }
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.renderer.updateTexture(texture, buffer.canvas);
}

/**
 * @return {WebGLTexture}
 */
function createBackgroundBuffer() {
  if (this.bg instanceof WebGLTexture) {
    this.renderer.destroyTexture(this.bg);
  }
  var size = 8;
  var cw = this.width;
  var ch = this.height;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);
  // bright rectangles
  ctx.fillStyle = "#212121";
  for (var yy = 0; yy < ch; yy += size*2) {
    for (var xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    }
  }
  for (var yy$1 = size; yy$1 < ch; yy$1 += size*2) {
    for (var xx$1 = size; xx$1 < cw; xx$1 += size*2) {
      ctx.fillRect(xx$1, yy$1, size, size);
    }
  }
  var texture = this.renderer.bufferTexture("background", canvas, false);
  return (texture);
}


var _generate = Object.freeze({
	createGridBuffer: createGridBuffer,
	redrawGridBuffer: redrawGridBuffer,
	createBackgroundBuffer: createBackgroundBuffer
});

/**
 * @class Poxi
 */
var Poxi = function Poxi(obj) {
  if ( obj === void 0 ) obj = {};

  // buffers
  this.bg = null;
  this.view = null;
  this.grid = null;
  this.tile = null;
  this.gridTexture = null;
  this.events = {};
  this.camera = new Camera(this);
  this.renderer = new WGLRenderer(this);
  this.editor = new Editor(this);
  // fps
  this.last = 0;
  this.width = 0;
  this.height = 0;
  this.frames = 0;
  this.states = {
    paused: true
  };
  this.hideGrid = false;
  this.createView();
  this.applySettings(obj);
  this.init();
};

/**
 * @param {Object} obj
 */
Poxi.prototype.applySettings = function applySettings (obj) {
  var grid = !DEFAULT_GRID_HIDDEN;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;
  // apply sizing
  if (obj.width >= 0) {
    width = obj.width | 0;
  }
  if (obj.height >= 0) {
    height = obj.height | 0;
  }
  // apply grid
  if (obj.grid !== void 0) {
    grid = !!obj.grid;
  }
  this.hideGrid = !grid;
  this.resize(width, height);
};

Poxi.prototype.init = function init () {
  this.camera.scale(0);
  this.renderLoop();
};

Poxi.prototype.createView = function createView () {
  var canvas = document.createElement("canvas");
  canvas.width = this.width;
  canvas.height = this.height;
  this.view = canvas;
  this.renderer.setup(canvas);
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
 * Is it necessary to show the grid
 * @return {Boolean}
 */
Poxi.prototype.showGrid = function showGrid () {
  return (
    !this.hideGrid && this.camera.s > (MIN_SCALE + HIDE_GRID)
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
  var sindex = editor.sindex;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    // ignore future batches
    if (sindex < ii) { continue; }
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
 * Returns given batches from the editor
 * @param {Boolean} relative
 * @return {Array}
 */
Poxi.prototype.getBatches = function getBatches (relative) {
    if ( relative === void 0 ) relative = false;

  var data = [];
  var sindex = this.editor.sindex;
  var batches = this.editor.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    // only take stack relative batches
    if (relative && sindex - ii < 0) { continue; }
    data.push(batches[ii]);
  }
  return (data);
};

/**
 * Get given color at mouse position
 * @param {Number} mx
 * @param {Number} my
 * @return {String}
 */
Poxi.prototype.getColorAtMouseOffset = function getColorAtMouseOffset (mx, my) {
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x;
  var ry = relative.y;
  var color = this.editor.getStackRelativeTileColorAt(rx, ry);
  return (color ? rgbaToHex(color) : null);
};

inherit(Poxi, _render);
inherit(Poxi, _generate);

// apply to window
if (typeof window !== "undefined") {
  window.Poxi = Poxi;
} else {
  throw new Error("Please run Poxi inside a browser");
}

})));
//# sourceMappingURL=poxi.js.map
