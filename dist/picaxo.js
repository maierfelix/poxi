(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

var MIN_SCALE = 1;
var MAX_SCALE = 35;

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
  this.s += x;
  if (this.s + x <= MIN_SCALE) { this.s = MIN_SCALE; }
  	if (this.s + x >= MAX_SCALE) { this.s = MAX_SCALE; }
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
 * @class Tile
 */
var Tile = function Tile() {
  this.x = 0;
  this.y = 0;
  /**
   * color index to restore previous color states
   */
  this.cindex = 0;
  this.colors = [];
};

/**
 * @class Editor
 */
var Editor = function Editor(instance) {
  this.modes = {
    draw: false,
    drag: false
  };
  this.batches = {
    tiles: []
  };
  this.colorTest = null;
  this.camera = instance.camera;
  this.commander = instance.commander;
};

	/**
	 * @param {Number} x
	 * @param {Number} y
 * @param {Boolean} state
	 */
Editor.prototype.select = function select (x, y, state) {
  this.modes.drag = state;
  this.modes.draw = !!state;
  if (state && this.modes.draw) {
    this.colorTest = this.setRandomColor();
    this.pushTileBatchOperation();
    this.pushTileBatch(x, y);
    this.clearLatestTileBatch();
  }
};

/**
 * Clear latest batch operation if empty
 */
Editor.prototype.clearLatestTileBatch = function clearLatestTileBatch () {
  var batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (batch.length <= 0) {
    var offset = this.batches.tiles.length - 1;
    this.batches.tiles.splice(offset, 1);
  }
};

/**
 * @return {Array}
 */
Editor.prototype.setRandomColor = function setRandomColor () {
  var r = ((Math.random() * 255) + 1) | 0;
  var g = ((Math.random() * 255) + 1) | 0;
  var b = ((Math.random() * 255) + 1) | 0;
  return ([r, g, b, 1]);
};

	/**
	 * @param {Number} x
	 * @param {Number} y
 * @return {Object}
	 */
Editor.prototype.getRelativeOffset = function getRelativeOffset (x, y) {
  var pos = this.camera.getRelativeOffset(x, y);
  pos.x = roundTo(pos.x - 4, 8);
  pos.y = roundTo(pos.y - 4, 8);
  return (pos);
};

	/**
	 * @param {Number} x
	 * @param {Number} y
	 */
Editor.prototype.createTileByMouseOffset = function createTileByMouseOffset (x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = new Tile();
  tile.x = position.x;
  tile.y = position.y;
  return (tile);
};

/**
 * @return {Array}
 */
Editor.prototype.getLatestTileBatchOperation = function getLatestTileBatchOperation () {
  var offset = this.batches.tiles.length - 1;
  var batch = this.batches.tiles;
  return (batch[offset]);
};

/**
 * Push in a new batch operation
 */
Editor.prototype.pushTileBatchOperation = function pushTileBatchOperation () {
  var operation = [];
  this.batches.tiles.push(operation);
  this.commander.push({
    operation: operation
  });
};

	/**
 * Clear earlier tile at given position
 * ==> update its color and old color value
	 * @param {Number} x
	 * @param {Number} y
 * @return {Number}
	 */
Editor.prototype.getTileFromMouseOffset = function getTileFromMouseOffset (x, y) {
  var position = this.getRelativeOffset(x, y);
  var tile = this.findTileAt(position.x, position.y);
  return (tile);
};

/**
 * Collect all tiles at given relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
Editor.prototype.findTileAt = function findTileAt (x, y) {
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
};

	/**
 * Create, push and batch a new tile at x,y
	 * @param {Number} x
	 * @param {Number} y
	 */
Editor.prototype.pushTileBatch = function pushTileBatch (x, y) {
  var otile = this.getTileFromMouseOffset(x, y);
  var tile = this.createTileByMouseOffset(x, y);
  var color = [
    this.colorTest[0],
    this.colorTest[1],
    this.colorTest[2],
    this.colorTest[3]
  ];
  // previous tile found, update it
  if (otile !== null) {
    // check if we have to overwrite the old tiles color
    // e.g => push in a new color state
    var matches = this.colorArraysMatch(
      color,
      otile.colors[otile.cindex]
    );
    // old and new colors doesnt match, insert new color values
    // into the old tile's color array to save its earlier state
    if (!matches) {
      otile.colors.unshift(color);
    }
  // if no tile found, push it into the batch
  } else {
    var batch = this.getLatestTileBatchOperation();
    tile.colors.push(color);
    batch.push(tile);
  }
};

/**
 * Compare two color arrays if they match both
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 */
Editor.prototype.colorArraysMatch = function colorArraysMatch (a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
};

	/**
	 * @param {Number} x
	 * @param {Number} y
	 */
Editor.prototype.drag = function drag (x, y) {
  if (this.modes.drag) {
    if (this.modes.draw) {
      this.pushTileBatch(x, y);
    }
  }
};

	/**
	 * @param {Number} x
	 * @param {Number} y
	 */
Editor.prototype.hover = function hover (x, y) {
  //console.log("Hover", x, y);
};

/**
 * @class Commander
 */
var Commander = function Commander(instance) {
  this.index = 0;
  this.stack = [];
  this.instance = instance;
};

/**
 * Update and secure stack index
 * TODO: Secure, remove throw error
 * @param {Number} idx
 */
Commander.prototype.updateStackIndex = function updateStackIndex (idx) {
  var value = this.index + idx;
  if (value >= 0 && value <= this.stack.length - 1) {
    this.index = value;
  } else {
    throw new Error("Stack index out of bounds!");
  }
};

Commander.prototype.undo = function undo () {
  this.updateStackIndex(-1);
  return (this.stack[this.index]);
};

Commander.prototype.redo = function redo () {
  this.updateStackIndex(-1);
  return (this.stack[this.index]);
};

/**
 * @param {Array} op
 */
Commander.prototype.push = function push (op) {
  this.stack.push(op);
};

function inherit(cls, prot) {

  var key = null;

  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  }

}

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
  this.clear();
  this.render();
}

function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

function render() {
  this.renderGrid();
  this.renderTiles();
  this.renderFPS();
}

function renderFPS() {
  var now = Date.now();
  var delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
}

function renderTiles() {
  var ctx = this.ctx;
  var cx = this.camera.x;
  var cy = this.camera.y;
  var scale = this.camera.s;
  var batches = this.editor.batches.tiles;
  // all tile batch operations
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    // process each batched tiles
    for (var jj = 0; jj < batch.length; ++jj) {
      var tile = batch[jj];
      var x = (cx + (tile.x * scale))|0;
      var y = (cy + (tile.y * scale))|0;
      var ww = (8*scale)|0;
      var hh = (8*scale)|0;
      var color = tile.colors[tile.cindex];
      var r = color[0];
      var g = color[1];
      var b = color[2];
      var a = color[3];
      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
      ctx.fillRect(x, y, ww, hh);
    }
  }
}

function renderGrid() {

  var ctx = this.ctx;
  var size = 8 * this.camera.s;

  var cx = this.camera.x;
  var cy = this.camera.y;
  var cw = this.camera.width;
  var ch = this.camera.height;

  ctx.lineWidth = .25;

  ctx.strokeStyle = "#8a8a8a";

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

var _render = Object.freeze({
	resize: resize$1,
	clear: clear,
	render: render,
	renderFPS: renderFPS,
	renderTiles: renderTiles,
	renderGrid: renderGrid
});

/**
 * @class Picaxo
 */
var Picaxo = function Picaxo(obj) {
  this.ctx = null;
  this.view = null;
  this.camera = new Camera(this);
  this.commander = new Commander(this);
  this.editor = new Editor(this);
  // fps
  this.last = 0;
  this.width = 0;
  this.height = 0;
  // view only passed, skip options
  if (obj && this.isViewElement(obj)) {
    this.applyView(obj);
    return;
  }
  // apply view
  this.applyView(obj.view);
  // apply sizing
  if (obj.width >= 0 && obj.height >= 0) {
    this.resize(obj.width, obj.height);
  } else {
    this.resize(view.width, view.height);
  }
};

/**
 * @param {HTMLCanvasElement} view
 */
Picaxo.prototype.applyView = function applyView (view) {
  if (this.isViewElement(view)) {
    this.view = view;
    this.ctx = view.getContext("2d");
  } else {
    throw new Error("Invalid view element provided");
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

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Picaxo needs to run as a website");
}

})));
