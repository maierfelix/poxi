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

var TILE_SIZE = 8;
var MIN_SCALE = 0.5;
var MAX_SCALE = 35;
var BASE_TILE_COLOR = [0,0,0,0];

// alpha byte to rgb-alpha conversion
var MAGIC_RGB_A_BYTE = 0.00392;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding max throws an out of bounds error
 */
var BATCH_BUFFER_SIZE = {
  MIN_W: 128,
  MIN_H: 128,
  MAX_W: 1048,
  MAX_H: 1048
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
 * @param {Number} x
 */
Camera.prototype.scale = function scale (x) {
  x = (x * 42) / (Math.hypot(this.width, this.height) / 2) * zoomScale(this.s);
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
  }
  this.stack.splice(this.sindex + 1, this.stack.length);
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
  console.log("Dequeue stack by", count, "operations");
  var batches = this.batches.tiles;
  // free all following (more recent) tile batches
  for (var ii = 0; ii < count; ++ii) {
    var idx = (from + ii);
    var op = this$1.stack[idx];
    // TODO: Stable, no memory leaks?
    var sliced = batches.splice(op.index, 1);
    for (var jj = 0; jj < sliced.length; ++jj) {
      var batch = sliced[jj];
      for (var kk = 0; kk < batch.length; ++kk) {
        var tile = batch[kk];
        if (!(tile.overwrite.length)) { continue; }
        var ow = tile.overwrite.splice(0, 1)[0];
        tile.colors.shift();
        tile.cindex = ow.cindex - 1;
      }
    }
    // recalculate stack batch index because we removed something
    // (we need valid stack indexes again after this iteration)
    for (var jj$1 = 0; jj$1 < this.stack.length; ++jj$1) {
      this$1.stack[jj$1].index -= 1;
    }
  }
}

/**
 * @param {Array} op
 * @param {Boolean} state
 */
function fire(op, state) {
  op.batch.map(function (tile) {
    var cindex = tile.cindex;
    var colors = tile.colors.length - 1;
    if (state === true) {
      // redo
      tile.cindex -= (cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (cindex < colors ? 1 : 0);
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
  this.overwrite = [];
  this.isHovered = false;
};
/**
 * @param {Number} cindex
 * @return {String}
 */
Tile.prototype.getColorAsRgbaString = function getColorAsRgbaString (cindex) {
  cindex = cindex || 0;
  var color = this.colors[cindex];
  var r = color[0];
  var g = color[1];
  var b = color[2];
  var a = color[3];
  return (
    ("rgba(" + r + "," + g + "," + b + "," + a + ")")
  );
};

/**
 * @param {Number} x
 * @param {Number} y
 */
function drawTileAtMouseOffset(x, y) {
  if (this.modes.draw) {
    this.pushTileBatch(x, y, false);
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 * @return {Tile}
 */
function drawTileAt(x, y, color) {
  var tile = this.createTileAt((x*TILE_SIZE)|0, (y*TILE_SIZE)|0);
  tile.colors.unshift(color);
  this.batches.tiles.push([tile]);
  this.finalizeBatchOperation();
  return (tile);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} state
 */
function select(x, y, state) {
  this.modes.drag = state;
  this.modes.draw = !!state;
  if (state && this.modes.draw) {
    this.colorTest = this.getRandomRgbaColors();
    this.pushTileBatchOperation();
    this.pushTileBatch(x, y, false);
    this.clearLatestTileBatch();
  } else {
    // finally push the created batch into the cmd stack
    this.finalizeBatchOperation();
  }
}

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
  this.unHoverAllTiles();
  var tile = this.getTileByMouseOffset(x, y);
  if (tile !== null) {
    // set current tile as hovered
    this.hovered.push(tile);
    tile.isHovered = true;
  }
}

/**
 * Set isHovered=false in hovered tiles array
 */
function unHoverAllTiles() {
  var this$1 = this;

  for (var ii = 0; ii < this.hovered.length; ++ii) {
    this$1.hovered[ii].isHovered = false;
    this$1.hovered.splice(ii, 1);
  }
}

/**
 * Take the latest tile batch, buffers if necessary
 * and finally pushes it into the operation stack
 */
function finalizeBatchOperation() {
  var offset = this.batches.tiles.length - 1;
  var batch = this.batches.tiles[offset];
  {
    var buffer = this.createBufferFromBatch(batch);
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
  if (batch.length <= 0) {
    var offset = this.batches.tiles.length - 1;
    this.batches.tiles.splice(offset, 1);
  }
}

/**
 * @return {Array}
 */
function getLatestTileBatchOperation() {
  var offset = this.batches.tiles.length - 1;
  var batch = this.batches.tiles;
  return (batch[offset]);
}

/**
 * Push in a new batch operation
 */
function pushTileBatchOperation() {
  var operation = [];
  this.batches.tiles.push(operation);
}

/**
 * Create, push and batch a new tile at x,y
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} relative
 */
function pushTileBatch(x, y, relative) {
  var otile = (
    relative ? this.getTileByPosition(x, y) :
    this.getTileByMouseOffset(x, y)
  );
  var color = [
    this.colorTest[0],
    this.colorTest[1],
    this.colorTest[2],
    this.colorTest[3]
  ];
  var batch = this.getLatestTileBatchOperation();
  // previous tile found, update it
  if (otile !== null) {
    var ocolors = otile.colors[otile.cindex];
    // check if we have to overwrite the old tiles color
    // e.g => push in a new color state
    var matches = this.colorArraysMatch(
      color,
      ocolors
    );
    // old and new colors doesnt match, insert new color values
    // into the old tile's color array to save its earlier state
    // as well as push in a new stack operation
    if (!matches && ocolors[3] !== 2) {
      otile.colors.unshift(color);
      otile.overwrite.unshift({
        cindex: otile.cindex + 1, // shift by 1, since we unshifted before
        tile: otile
      });
      batch.push(otile);
    }
  // if no tile found, create one and push it into the batch
  } else {
    var tile = (
      relative ? this.createTileAt(x, y) :
      this.createTileAtMouseOffset(x, y)
    );
    tile.colors.unshift(color);
    batch.push(tile);
  }
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
 * Compare two color arrays if they match both
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 */
function colorArraysMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
}

/**
 * Calculate cropped size of given batch
 * @param {Array} batch
 * @return {Object}
 */
function getBatchSize(batch) {
  // start position at maximum buffer size
  var x = BATCH_BUFFER_SIZE.MAX_W;
  var y = BATCH_BUFFER_SIZE.MAX_H;
  var px = [];
  var py = [];
  for (var ii = 0; ii < batch.length; ++ii) {
    var tile = batch[ii];
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
}

/**
 * Creates a cropped canvas buffer from a tile batch
 */
function createBufferFromBatch(batch) {
  var info = this.getBatchSize(batch);
  var obj = {
    x: info.x,
    y: info.y,
    width: info.w,
    height: info.h,
    buffer: null
  };
  var buffer = this.instance.createCanvasBuffer(info.w, info.h);
  var ww = info.w;
  for (var ii = 0; ii < batch.length; ++ii) {
    var tile = batch[ii];
    var color = tile.colors[tile.cindex];
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    var xx = ii % ww;
    var yy = Math.floor(ii / ww);
    buffer.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  }
  this.instance.rofl = buffer.canvas;
}

/**
 * @param {Array} batch
 * @return {Boolean}
 */
function batchSizeExceedsLimit(batch) {
  var size = this.getBatchSize(batch); 
  return (
    size.w >= BATCH_BUFFER_SIZE.MIN_W &&
    size.h >= BATCH_BUFFER_SIZE.MIN_W
  );
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
  tile.x = x;
  tile.y = y;
  return (tile);
}

/**
 * Clear earlier tile at given position
 * => update its color and old color value
 * @param {Number} x
 * @param {Number} y
 * @return {Number}
 */
function getTileByMouseOffset(x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = this.getTileByPosition(position.x, position.y);
  return (tile);
}

/**
 * Collect all tiles at given relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
function getTileByPosition(x, y) {
  var target = null;
  var batches = this.batches.tiles;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
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
 * Get tile by it's id
 * @param {Number} id
 * @return {Tile}
 */
function getTileById(id) {
  var batches = this.batches.tiles;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    for (var jj = 0; jj < batch.length; ++jj) {
      if (batch[jj].id === id) { return (tile); }
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

/**
 * Transforms passed canvas ctx into a single batch operation
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
function insertSpriteContextAt(ctx, x, y) {
  var this$1 = this;

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
  var tiles = [];
  for (var yy$1 = 0; yy$1 < height; ++yy$1) {
    for (var xx$1 = 0; xx$1 < width; ++xx$1) {
      var idx = (xx$1+(yy$1*width))*4;
      var a = data[idx+3];
      if (a <= 0) { continue; } // ignore whitespace
      var r = data[idx+0];
      var g = data[idx+1];
      var b = data[idx+2];
      // create relative batched tile
      var tile = this$1.createTileAt(
        mx + (xx$1 * TILE_SIZE),
        my + (yy$1 * TILE_SIZE)
      );
      // 0-255 => 0-1 with precision 1
      a = Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10;
      tile.colors.unshift([r,g,b,a]);
      batch.push(tile);
    }
  }
  this.clearLatestTileBatch();
  if (batch.length) { this.finalizeBatchOperation(); }
}


var _tiles = Object.freeze({
	drawTileAtMouseOffset: drawTileAtMouseOffset,
	drawTileAt: drawTileAt,
	select: select,
	selectAll: selectAll,
	hover: hover,
	unHoverAllTiles: unHoverAllTiles,
	finalizeBatchOperation: finalizeBatchOperation,
	clearLatestTileBatch: clearLatestTileBatch,
	getLatestTileBatchOperation: getLatestTileBatchOperation,
	pushTileBatchOperation: pushTileBatchOperation,
	pushTileBatch: pushTileBatch,
	getRandomRgbaColors: getRandomRgbaColors,
	colorArraysMatch: colorArraysMatch,
	getBatchSize: getBatchSize,
	createBufferFromBatch: createBufferFromBatch,
	batchSizeExceedsLimit: batchSizeExceedsLimit,
	getRelativeOffset: getRelativeOffset$1,
	getTileOffsetAt: getTileOffsetAt,
	createTileAtMouseOffset: createTileAtMouseOffset,
	createTileAt: createTileAt,
	getTileByMouseOffset: getTileByMouseOffset,
	getTileByPosition: getTileByPosition,
	getTileById: getTileById,
	isTileInsideView: isTileInsideView,
	insertSpriteContextAt: insertSpriteContextAt
});

/**
 * @class Editor
 */
var Editor = function Editor(instance) {
  this.instance = instance;
  this.modes = {
    draw: false,
    drag: false,
    selectAll: false
  };
  this.batches = {
    tiles: []
  };
  // mouse position
  this.mx = 0;
  this.my = 0;
  this.hovered = [];
  this.colorTest = null;
  this.camera = instance.camera;
  // stack related
  this.sindex = -1;
  this.stack = [];
};

inherit(Editor, _stack);
inherit(Editor, _tiles);

/**
 * @param {Number} width
 * @param {Number} height
 */
function resize$1(width, height) {
  if (width >= 0) { this.width = width; }
  if (height >= 0) { this.height = height; }
  this.view.width = width;
  this.view.height = height;
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
  this.renderTiles();
  if (this.rofl) {
    this.ctx.drawImage(
      this.rofl,
      0, 0
    );
  }
  if (this.camera.s > MIN_SCALE) {
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

  ctx.lineWidth = .25;
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

function renderTiles() {
  var this$1 = this;

  var ctx = this.ctx;
  var cx = this.camera.x;
  var cy = this.camera.y;
  var scale = this.camera.s;
  var ww = (TILE_SIZE*scale)|0;
  var hh = (TILE_SIZE*scale)|0;
  var selectAll = this.editor.modes.selectAll;
  var batches = this.editor.batches.tiles;
  // all tile batch operations
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    // process each batched tiles
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      var x = (cx + (tile.x * scale))|0;
      var y = (cy + (tile.y * scale))|0;
      var color = tile.colors[tile.cindex];
      var r = color[0];
      var g = color[1];
      var b = color[2];
      var a = color[3];
      // apply selection effect
      if (selectAll) { a = 0.1; }
      else if (tile.isHovered) { a /= 1.5; }
      if (this$1.editor.isTileInsideView(tile)) {
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        ctx.fillRect(x, y, ww, hh);
      }
    }
  }
}

function renderStats() {
  this.ctx.fillStyle = "#ffffff";
  // render mouse hovered color
  var mx = this.editor.mx;
  var my = this.editor.my;
  var relative = this.editor.getRelativeOffset(mx, my);
  var rx = relative.x;
  var ry = relative.y;
  var tile = this.editor.getTileByPosition(rx, ry);
  this.ctx.fillText(("x:" + rx + ", y:" + ry), 16, 32);
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

  var cw = this.camera.width;
  var ch = this.camera.height;

  var buffer = this.createCanvasBuffer(cw, ch);

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
	renderTiles: renderTiles,
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
  var buffer = this.createCanvasBuffer(this.width, this.height);
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

/**
 * @param {Number} width
 * @param {Number} height
 * @return {CanvasRenderingContext2D}
 */
Picaxo.prototype.createCanvasBuffer = function createCanvasBuffer (width, height) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  this.applyImageSmoothing(ctx, false);
  return (ctx);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Boolean} state
 */
Picaxo.prototype.applyImageSmoothing = function applyImageSmoothing (ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
};

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Please run Picaxo inside a browser");
}

})));
