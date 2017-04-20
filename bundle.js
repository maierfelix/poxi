(function() { 'use strict';

/**
 * @param {Class} cls
 * @param {Array} prot
 */
var extend = function(cls, prot) {
  for (var key in prot) {
    if (prot[key] instanceof Function) {
      if (cls.prototype[key] instanceof Function) {
        console.log(("Warning: Overwriting " + (cls.name) + ".prototype." + key));
      }
      cls.prototype[key] = prot[key];
    }
  }
};

/**
 * @return {Object}
 */
function getSelection() {
  // active shape selection
  if (this.shape !== null) {
    var bounds = this.shape.bounds;
    return ({
      shape: this.shape,
      x: bounds.x, y: bounds.y,
      w: bounds.w, h: bounds.h
    });
  }
  var x = this.sx; var y = this.sy;
  var w = this.sw; var h = this.sh;
  if (w < 0) { x += w; }
  if (h < 0) { y += h; }
  w = w < 0 ? -w : w;
  h = h < 0 ? -h : h;
  return ({
    shape: null,
    x: x, y: y,
    w: w, h: h
  });
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function selectFrom(x, y) {
  x = x | 0;
  y = y | 0;
  var relative = this.getRelativeTileOffset(x, y);
  this.sx = relative.x;
  this.sy = relative.y;
  this.sw = this.sh = 0;
  this.redraw = true;
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function selectTo(x, y) {
  x = x | 0;
  y = y | 0;
  var relative = this.getRelativeTileOffset(x, y);
  var w = relative.x - this.sx;
  var h = relative.y - this.sy;
  w = w + (w >= 0 ? 1 : 0);
  h = h + (h >= 0 ? 1 : 0);
  this.sw = w;
  this.sh = h;
  this.redraw = true;
}

function resetSelection() {
  this.sx = this.sy = 0;
  this.sw = this.sh = -0;
  if (this.shape !== null) {
    this.destroyTexture(this.shape.texture);
    this.shape = null;
  }
  this.redraw = true;
}


var _select = Object.freeze({
	getSelection: getSelection,
	selectFrom: selectFrom,
	selectTo: selectTo,
	resetSelection: resetSelection
});

// default view size


// default grid hidden or not


var TILE_SIZE = 8;
var MIN_SCALE = 0.1;
var MAX_SCALE = 32;
var BASE_SCALE = 1;
var MAGIC_SCALE = .125;
// trace ghost tiles by alpha=^2


var BASE_TILE_COLOR = [0, 0, 0, 0];
var SELECTION_COLOR = [1, 1, 1, 0.1];
var SELECTION_COLOR_ACTIVE = [1, 1, 1, 0.2];
var TILE_HOVER_COLOR = [1, 1, 1, 0.2];

// 32-bit ints are allowed at maximum
var MAX_SAFE_INTEGER = (Math.pow( 2, 31 )) - 1;

// alpha byte to rgb-alpha conversion
var MAGIC_RGB_A_BYTE = 0.00392;

// factor when to hide the grid
var HIDE_GRID = 1.0;
var GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
var ZOOM_SPEED = 15;

// base step size we jump when resizing batches
var BATCH_JUMP_RESIZE = 64;

// Maximum allowed items inside stack
var STACK_LIMIT = 128;

// WebGL texture limit
var WGL_TEXTURE_LIMIT = STACK_LIMIT * 2;

// WebGL supported or not
var WGL_SUPPORTED = (
  typeof WebGLRenderingContext !== "undefined"
);

// WebAssembly supported or not


// dev mode state
var MODES = {
  DEV: true
};

// different settings
var SETTINGS = {
  LIGHT_SIZE: 1,
  PENCIL_SIZE: 1,
  ERASER_SIZE: 1,
  LIGHTING_MODE: 0.05
};

var STORAGE_KEY = "poxi";
var STORAGE_OBJECT = window.localStorage;

// asset path
var ASSET_PATH = "./assets/";

// light bulb icon res
var LIGHT_DARKEN_IMG_PATH = ASSET_PATH + "img/light_off.png";
var LIGHT_LIGHTEN_IMG_PATH = ASSET_PATH + "img/light_on.png";

/**
 * Returns unique integer
 * @return {Number}
 */
var uidx = 0;
function uid() {
  return (++uidx);
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

/**
 * 0-255 => 0-1 with precision 1
 * @param {Number} a
 * @return {Number}
 */
function alphaByteToRgbAlpha(a) {
  return (Math.round((a * MAGIC_RGB_A_BYTE) * 10) / 10);
}

/**
 * 0-1 => 0-255
 * Derivative of alphaByteToRgbAlpha
 * @param {Number} a
 * @return {Number}
 */
function rgbAlphaToAlphaByte(a) {
  return (Math.round((a / MAGIC_RGB_A_BYTE) * 10) / 10) | 0;
}

/**
 * Convert rgba to rgba byte color
 * @param {Array} rgba
 * @return {Array}
 */


/**
 * Convert bytes to rgba color
 * @param {Array} bytes
 * @return {Array}
 */
function bytesToRgba(bytes) {
  var r = bytes[0] * 255;
  var g = bytes[1] * 255;
  var b = bytes[2] * 255;
  var a = bytes[3];
  return ([r, g, b, a]);
}

/**
 * @param {Uint8Array} aa
 * @param {Uint8Array} bb
 * @param {Number} dir
 * @return {Uint8Array}
 */


/**
 * Additive color blending with alpha support
 * @param {Uint8Array} src
 * @param {Uint8Array} dst
 * @return {Uint8Array}
 */
function additiveAlphaColorBlending(src, dst) {
  var a1 = ((src[3] * MAGIC_RGB_A_BYTE) * 10) / 10;
  var a2 = ((dst[3] * MAGIC_RGB_A_BYTE) * 10) / 10;
  var a = 1 - (1 - a2) * (1 - a1);
  var r = ((dst[0] * a2 / a) + (src[0] * a1 * (1 - a2) / a)) | 0;
  var g = ((dst[1] * a2 / a) + (src[1] * a1 * (1 - a2) / a)) | 0;
  var b = ((dst[2] * a2 / a) + (src[2] * a1 * (1 - a2) / a)) | 0;
  src[0] = r;
  src[1] = g;
  src[2] = b;
  src[3] = ((a / MAGIC_RGB_A_BYTE) * 10) / 10;
  return (src);
}

/**
 * @param {Uint8Array} rgba
 * @return {Uint8Array}
 */


/**
 * @param {Uint8Array} rgba
 * @return {Uint8Array}
 */


/**
 * @return {Array}
 */


/**
 * @return {Array}
 */


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
  return ([r, g, b, 1]);
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

var CommandKind = {
  UNKNOWN: 0,
  LAYER_OPERATION: 1,
  BATCH_OPERATION: 2,
  0xDEADBEEF: 3,
  DRAW: 4,
  ERASE: 5,
  FILL: 6,
  BACKGROUND: 7,
  PASTE: 8,
  CUT: 9,
  INSERT_IMAGE: 10,
  STROKE: 11,
  RECT_FILL: 12,
  RECT_STROKE: 13,
  ARC_FILL: 14,
  ARC_STROKE: 15,
  FLOOD_FILL: 16,
  LIGHTING: 17,
  LAYER_ADD: 18,
  LAYER_REMOVE: 19,
  LAYER_LOCK: 20,
  LAYER_FLIP_VERTICAL: 21,
  LAYER_FLIP_HORIZONTAL: 22,
  LAYER_MOVE: 23,
  LAYER_ORDER: 24,
  LAYER_RENAME: 25,
  LAYER_ROTATE: 26,
  LAYER_VISIBILITY: 27,
  LAYER_CLONE: 28,
  LAYER_MERGE: 29
};

/**
 * @param {Object} selection
 */
function copy(selection) {
  this.clipboard.copy = null;
  // shape based selection
  if (selection.shape !== null) {
    this.copyByShape(selection);
  } else {
    this.copyBySelection(selection);
  }
}

/**
 * Shape-based copying
 * @param {Object} selection
 */
function copyByShape(selection) {
  var this$1 = this;

  var shape = selection.shape;
  var data = shape.data;
  var bx = shape.bounds.x; var by = shape.bounds.y;
  var bw = shape.bounds.w; var bh = shape.bounds.h;
  var pixels = [];
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = ii / 4;
    var xx = idx % bw;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    var alpha = data[px + 3];
    // ignore shape pixels that aren't used
    if (alpha <= 0) { continue; }
    var pixel = this$1.getAbsolutePixelAt(bx + xx, by + yy);
    if (pixel === null) { continue; }
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  }
  this.clipboard.copy = {
    pixels: pixels,
    selection: selection
  };
}

/**
 * Rectangle-based copying
 * @param {Object} selection
 */
function copyBySelection(selection) {
  var this$1 = this;

  var x = selection.x; var y = selection.y;
  var w = selection.w; var h = selection.h;
  var pixels = [];
  for (var ii = 0; ii < w * h; ++ii) {
    var xx = ii % w;
    var yy = (ii / w) | 0;
    var pixel = this$1.getAbsolutePixelAt(x + xx, y + yy);
    if (pixel === null) { continue; }
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  }
  this.clipboard.copy = {
    pixels: pixels,
    selection: selection
  };
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Object} sel
 * @return {Void}
 */
function pasteAt(x, y, sel) {
  var pixels = sel.pixels;
  if (pixels === null || !pixels.length) { return; }
  var layer = this.getCurrentLayer();
  var batch = layer.createBatchAt(x, y);
  batch.resizeRectangular(
    x, y,
    sel.w - 1, sel.h - 1
  );
  for (var ii = 0; ii < pixels.length; ++ii) {
    var pixel = pixels[ii];
    var color = pixel.color;
    batch.drawPixelFast(x + pixel.x, y + pixel.y, color);
  }
  batch.refreshTexture(false);
  this.enqueue(CommandKind.PASTE, batch);
  return;
}

/**
 * @param {Object} selection
 * @return {Void}
 */
function cut(selection) {
  this.copy(selection);
  var pixels = this.clipboard.copy.pixels;
  if (pixels === null || !pixels.length) { return; }
  this.clearSelection(selection);
  return;
}

/**
 * Shape-based clearing
 * @param {Object} selection
 * @return {Void}
 */
function clearSelection(selection) {
  var this$1 = this;

  var shape = selection.shape;
  var bounds = shape.bounds;
  var data = shape.data;
  var x = selection.x; var y = selection.y;
  var w = selection.w; var h = selection.h;
  var layer = this.getCurrentLayer();
  layer.createBatchAt(x, y);
  batch.isEraser = true;
  var bw = bounds.w; var bh = bounds.h;
  batch.resizeRectangular(
    x, y,
    w - 1, h - 1
  );
  var count = 0;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % bw) | 0;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    if (data[px + 3] <= 0) { continue; }
    var pixel = this$1.getAbsolutePixelAt(x + xx, y + yy);
    // only erase if we have sth to erase
    if (pixel === null) { continue; }
    batch.erasePixelFast(x + xx, y + yy, pixel);
    count++;
  }
  // nothing to change
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.refreshTexture(false);
  this.enqueue(CommandKind.CLEAR, batch);
  return;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
function getShapeAt(x, y) {
  var color = this.getAbsolutePixelAt(x, y);
  if (color === null) { return (null); }
  var shape = this.getBinaryShape(x, y, color);
  if (shape === null) { return (null); }
  var batch = this.createDynamicBatch(x, y);
  var bounds = this.bounds;
  var bx = bounds.x;
  var by = bounds.y;
  var bw = bounds.w;
  var bh = bounds.h;
  // create buffer to draw a fake shape into
  var buffer = createCanvasBuffer(bw, bh);
  var rgba = bytesToRgba(SELECTION_COLOR);
  rgba[3] = 0.45;
  buffer.fillStyle = colorToRgbaString(rgba);
  for (var ii = 0; ii < shape.length; ++ii) {
    var xx = (ii % bw);
    var yy = (ii / bw) | 0;
    if (shape[yy * bw + xx] !== 2) { continue; }
    buffer.fillRect(
      xx, yy,
      1, 1
    );
  }
  batch.buffer = buffer;
  batch.data = new Uint8Array(buffer.getImageData(0, 0, bw, bh).data);
  batch.bounds.update(bx, by, bw, bh);
  batch.resizeByMatrixData();
  batch.refreshTexture(true);
  return (batch);
}


var _area_functions = Object.freeze({
	copy: copy,
	copyByShape: copyByShape,
	copyBySelection: copyBySelection,
	pasteAt: pasteAt,
	cut: cut,
	clearSelection: clearSelection,
	getShapeAt: getShapeAt
});

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
 * @return {Boolean}
 */


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
 * @param {Number} value
 * @return {Number}
 */
function alignToGrid(value) {
  return (roundTo(value, TILE_SIZE));
}

/**
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @return {Number}
 */
function pointDistance(x1, y1, x2, y2) {
  var xx = Math.pow(x2 - x1, 2);
  var yy = Math.pow(y2 - y1, 2);
  return (Math.sqrt(xx + yy));
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
  x1 = x1 | 0; y1 = y1 | 0;
  w1 = w1 | 0; h1 = h1 | 0;
  x2 = x2 | 0; y2 = y2 | 0;
  w2 = w2 | 0; h2 = h2 | 0;
  var xx = Math.max(x1, x2);
  var ww = Math.min(x1 + w1, x2 + w2);
  var yy = Math.max(y1, y2);
  var hh = Math.min(y1 + h1, y2 + h2);
  return (ww >= xx && hh >= yy);
}

/**
 * @param {Number} dir
 */
function scale(dir) {
  var x = (dir * (ZOOM_SPEED / 1e2)) * zoomScale(this.cs);
  var oscale = this.cs;
  if (this.cs + x <= MIN_SCALE) { this.cs = MIN_SCALE; }
  else if (this.cs + x >= MAX_SCALE) { this.cs = MAX_SCALE; }
  else { this.cs += x; }
  this.cs = roundTo(this.cs, MAGIC_SCALE);
  if (this.cs >= (MAX_SCALE - 1) + .25) { this.cs = (MAX_SCALE - 1) + .25; }
  this.cx -= (this.lx) * (zoomScale(this.cs) - zoomScale(oscale));
  this.cy -= (this.ly) * (zoomScale(this.cs) - zoomScale(oscale));
  this.cr = roundTo(this.cs, MAGIC_SCALE);
  this.updateGrid();
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function hover(x, y) {
  x = x | 0;
  y = y | 0;
  this.mx = x;
  this.my = y;
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function click(x, y) {
  x = x | 0;
  y = y | 0;
  var position = this.getRelativeOffset(x, y);
  this.dx = x;
  this.dy = y;
  this.lx = position.x;
  this.ly = position.y;
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function drag(x, y) {
  x = x | 0;
  y = y | 0;
  this.cx += x - this.dx;
  this.cy += y - this.dy;
  this.dx = x;
  this.dy = y;
  this.updateGrid();
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getRelativeOffset(x, y) {
  x = x | 0;
  y = y | 0;
  var xx = (x - this.cx) / this.cs;
  var yy = (y - this.cy) / this.cs;
  return ({
    x: xx,
    y: yy
  });
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getRelativeTileOffset(x, y) {
  x = x | 0;
  y = y | 0;
  var rel = this.getRelativeOffset(x, y);
  return (
    this.getTileOffsetAt(rel.x, rel.y)
  );
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getTileOffsetAt(x, y) {
  x = x | 0;  
  y = y | 0;
  var half = TILE_SIZE / 2;
  var xx = alignToGrid(x - half);
  var yy = alignToGrid(y - half);
  return ({
    x: (xx / TILE_SIZE) | 0,
    y: (yy / TILE_SIZE) | 0
  });
}

/**
 * @param {Boundings} bounds 
 */
function boundsInsideView(bounds) {
  var cs = this.cs;
  var ww = (bounds.w * TILE_SIZE) * cs;
  var hh = (bounds.h * TILE_SIZE) * cs;
  var xx = ((bounds.x * TILE_SIZE) * cs) + this.cx;
  var yy = ((bounds.y * TILE_SIZE) * cs) + this.cy;
  return (
    (xx + ww >= 0 && xx <= this.cw) &&
    (yy + hh >= 0 && yy <= this.ch)
  );
}


var _camera = Object.freeze({
	scale: scale,
	hover: hover,
	click: click,
	drag: drag,
	getRelativeOffset: getRelativeOffset,
	getRelativeTileOffset: getRelativeTileOffset,
	getTileOffsetAt: getTileOffsetAt,
	boundsInsideView: boundsInsideView
});



var _emitter = Object.freeze({

});

function initListeners() {
  var this$1 = this;


  window.addEventListener("resize", function (e) { return this$1.onResize(e); });

  window.addEventListener("mousedown", function (e) { return this$1.onMouseDown(e); });
  window.addEventListener("mouseup", function (e) { return this$1.onMouseUp(e); });

  window.addEventListener("mousemove", function (e) { return this$1.onMouseMove(e); });

  window.addEventListener("keydown", function (e) { return this$1.onKeyDown(e); });
  window.addEventListener("keyup", function (e) { return this$1.onKeyUp(e); });

  window.addEventListener("contextmenu", function (e) { return this$1.onContextmenu(e); });

  window.addEventListener("wheel", function (e) { return this$1.onMouseWheel(e); });
  window.addEventListener("mousewheel", function (e) { return this$1.onMouseWheel(e); });

  this.view.addEventListener("mouseout", function (e) { return this$1.onMouseOut(e); });
  this.view.addEventListener("mouseleave", function (e) { return this$1.onMouseLeave(e); });

  menu.addEventListener("click", function (e) { return this$1.onColorMenuClick(e); });

}

/**
 * @param {Event} e
 */
function onResize(e) {
  this.resize(
    window.innerWidth, window.innerHeight
  );
}

/**
 * @param {Event} e
 */
function onMouseOut(e) {
  e.preventDefault();
  //this.onMouseUp(e);
}

/**
 * @param {Event} e
 */
function onMouseLeave(e) {
  e.preventDefault();
  //this.onMouseUp(e);
}

function resetListElementsActiveState(el) {
  for (var ii = 0; ii < el.children.length; ii++) {
    el.children[ii].classList.remove("active");
  }
}

/**
 * @param {HTMLElement} el
 * @return {Void}
 */
function onColorMenuClick(el) {
  var element = el.target;
  if (element.id) { return; }
  var value = element.getAttribute("color");
  var rgba = JSON.parse(value);
  this.setUiColor(rgbaToHex(rgba));
  return;
}

/**
 * @param {HTMLElement} el
 */
function processUIClick(el) {
  var parent = el.parentNode;
  if (!parent) { return; }
  var id = parent.id;
  if (id === "pencil-size") {
    var value = el.innerHTML;
    SETTINGS.PENCIL_SIZE = parseInt(value);
    this.resetModes();
    this.modes.draw = true;
    tiled.style.opacity = 1.0;
  }
  else if (id === "eraser-size") {
    var value$1 = el.innerHTML;
    SETTINGS.ERASER_SIZE = parseInt(value$1);
    this.resetModes();
    this.modes.erase = true;
    erase.style.opacity = 1.0;
  }
  else if (id === "light-size") {
    var value$2 = el.innerHTML;
    SETTINGS.LIGHT_SIZE = parseInt(value$2);
    this.resetModes();
    this.modes.light = true;
    lighting.style.opacity = 1.0;
  }
  else { return; }
  this.resetListElementsActiveState(el.parentNode);
  el.classList.add("active");
}

/**
 * @param {Event} e
 */
function onMouseDown(e) {
  // only allow clicking on canvas
  if (!(e.target instanceof HTMLCanvasElement)) {
    this.processUIClick(e.target);
    return;
  }
  var x = e.clientX;
  var y = e.clientY;
  var relative = this.getRelativeTileOffset(x, y);
  var rx = relative.x; var ry = relative.y;
  if (e.which === 1) {
    var layer = this.getCurrentLayer();
    if (layer === null) { return; }
    this.resetSelection();
    if (this.modes.move) {
      var layer$1 = this.getLayerByPoint(rx, ry);
      if (layer$1 !== null) {
        this.buffers.mLayer = this.getCurrentLayer();
        this.setActiveLayer(layer$1);
        this.states.moving = true;
        var batch = this.createDynamicBatch(rx, ry);
        batch.position.mx = rx;
        batch.position.my = ry;
        batch.layer = layer$1;
        batch.isMover = true;
        this.buffers.move = batch;
      }
    }
    else if (this.modes.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else if (this.modes.arc) {
      this.states.arc = true;
      this.buffers.arc = layer.createBatchAt(rx, ry);
      var batch$1 = this.buffers.arc;
      batch$1.forceRendering = true;
      batch$1.refreshTexture(false);
    }
    else if (this.modes.rect) {
      this.states.rect = true;
      this.buffers.rect = layer.createBatchAt(rx, ry);
      var batch$2 = this.buffers.rect;
      batch$2.forceRendering = true;
      batch$2.refreshTexture(false);
    }
    else if (this.modes.draw) {
      this.states.drawing = true;
      this.buffers.drawing = layer.createBatchAt(rx, ry);
      var batch$3 = this.buffers.drawing;
      batch$3.forceRendering = true;
      batch$3.drawAt(rx, ry, SETTINGS.PENCIL_SIZE, this.fillStyle);
      batch$3.refreshTexture(false);
    }
    else if (this.modes.erase) {
      this.states.erasing = true;
      this.buffers.erasing = layer.createBatchAt(rx, ry);
      var batch$4 = this.buffers.erasing;
      batch$4.forceRendering = true;
      batch$4.clearRect(rx, ry, SETTINGS.ERASER_SIZE, SETTINGS.ERASER_SIZE);
      batch$4.refreshTexture(false);
      batch$4.isEraser = true;
    }
    else if (this.modes.light) {
      this.states.lighting = true;
      this.buffers.lighting = layer.createBatchAt(rx, ry);
      var batch$5 = this.buffers.lighting;
      batch$5.forceRendering = true;
      batch$5.applyColorLightness(rx, ry, SETTINGS.LIGHTING_MODE);
      batch$5.refreshTexture(false);
    }
    else if (this.modes.stroke) {
      this.states.stroke = true;
      this.buffers.stroke = layer.createBatchAt(rx, ry);
      var batch$6 = this.buffers.stroke;
      batch$6.forceRendering = true;
      batch$6.refreshTexture(false);
    }
    else if (this.modes.flood) {
      this.floodPaint(rx, ry);
    }
    else if (this.modes.fill) {
      this.fillBucket(rx, ry, this.fillStyle);
    }
    else if (this.modes.shape) {
      var batch$7 = this.getShapeAt(rx, ry);
      this.shape = batch$7;
    }
    else if (this.modes.pipette) {
      this.states.pipette = true;
      var color = this.getAbsolutePixelAt(rx, ry);
      if (color !== null) {
        this.fillStyle = color;
        color_view.style.background = color.value = rgbaToHex(color);
      }
    }
  }
  else if (e.which === 3) {
    this.states.dragging = true;
    this.click(x, y);
  }
  if (e.which === 1) {
    this.last.mdx = x; this.last.mdy = y;
    var start = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    this.last.mdrx = start.x; this.last.mdry = start.y;
  }
}

var lastx = -0;
var lasty = -0;
/**
 * @param {Event} e
 */
function onMouseMove(e) {
  e.preventDefault();
  var x = e.clientX; var y = e.clientY;
  if (!(e.target instanceof HTMLCanvasElement)) { return; }
  var last = this.last;
  var layer = this.getCurrentLayer();
  var relative = this.getRelativeTileOffset(x, y);
  var rx = relative.x; var ry = relative.y;
  // mouse polling rate isn't 'per-pixel'
  // so we try to interpolate missed offsets
  if (this.modes.move) {
    this.redraw = true;
  }
  if (this.states.dragging) {
    this.drag(x, y);
    this.hover(x, y);
    lastx = x; lasty = y;
    last.mx = rx; last.my = ry;
    return;
  }
  if (last.mx === rx && last.my === ry) { return; }
  this.hover(x, y);
  this.redraw = true;
  if (this.states.moving) {
    var batch = this.buffers.move;
    batch.move(rx, ry);
    batch.refreshTexture(false);
  }
  else if (this.states.arc) {
    var batch$1 = this.buffers.arc;
    batch$1.clear();
    var sx = this.last.mdrx;
    var sy = this.last.mdry;
    var radius = pointDistance(sx, sy, rx, ry);
    this.strokeArc(batch$1, sx, sy, radius, this.fillStyle);
    batch$1.refreshTexture(false);
  }
  else if (this.states.rect) {
    var batch$2 = this.buffers.rect;
    batch$2.clear();
    var sx$1 = this.last.mdrx;
    var sy$1 = this.last.mdry;
    var ww = rx - sx$1;
    var hh = ry - sy$1;
    this.strokeRect(batch$2, sx$1, sy$1, ww, hh, this.fillStyle);
    batch$2.refreshTexture(false);
  }
  else if (this.states.stroke) {
    var batch$3 = this.buffers.stroke;
    batch$3.clear();
    this.insertLine(this.last.mdrx, this.last.mdry, rx, ry);
    batch$3.refreshTexture(false);
  }
  else if (this.states.drawing) {
    var batch$4 = this.buffers.drawing;
    this.insertLine(x, y, lastx, lasty);
    batch$4.refreshTexture(false);
  }
  else if (this.states.erasing) {
    var batch$5 = this.buffers.erasing;
    this.insertLine(x, y, lastx, lasty);
    batch$5.refreshTexture(false);
  }
  else if (this.states.lighting) {
    var batch$6 = this.buffers.lighting;
    this.insertLine(x, y, lastx, lasty);
    batch$6.refreshTexture(false);
  }
  else if (this.states.dragging) {
    this.drag(x, y);
  }
  else if (this.states.selecting) {
    this.selectTo(x, y);
  }
  else if (this.states.pipette) {
    var color = this.getAbsolutePixelAt(rx, ry);
    if (color !== null) {
      this.fillStyle = color;
      color_view.style.background = color.value = rgbaToHex(color);
    }
  }
  lastx = x; lasty = y;
  last.mx = rx; last.my = ry;
}

/**
 * @param {Event} e
 */
function onMouseUp(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) { return; }
  if (e.which === 1) {
    if (this.getCurrentLayer() === null) { return; }
    if (this.modes.move && this.buffers.move) {
      var batch = this.buffers.move;
      var layer = batch.layer;
      this.states.move = false;
      this.states.moving = false;
      // only enqueue if batch not empty
      if (batch.position.x !== 0 || batch.position.y !== 0) {
        layer.x -= batch.position.x;
        layer.y -= batch.position.y;
        this.enqueue(CommandKind.LAYER_MOVE, batch);
      } else {
        batch.kill();
      }
      this.setActiveLayer(this.buffers.mLayer);
      this.buffers.move = null;
    }
    else if (this.modes.arc) {
      var batch$1 = this.buffers.arc;
      batch$1.forceRendering = false;
      this.states.arc = false;
      batch$1.resizeByMatrixData();
      batch$1.refreshTexture(false);
      if (batch$1.isEmpty()) { batch$1.kill(); }
      else { this.enqueue(CommandKind.ARC_FILL, batch$1); }
      this.buffers.arc = null;
    }
    else if (this.modes.rect) {
      var batch$2 = this.buffers.rect;
      batch$2.forceRendering = false;
      this.states.rect = false;
      batch$2.resizeByMatrixData();
      batch$2.refreshTexture(false);
      if (batch$2.isEmpty()) { batch$2.kill(); }
      else { this.enqueue(CommandKind.RECT_FILL, batch$2); }
      this.buffers.rect = null;
    }
    else if (this.modes.stroke) {
      var batch$3 = this.buffers.stroke;
      batch$3.forceRendering = false;
      this.states.stroke = false;
      batch$3.resizeByMatrixData();
      batch$3.refreshTexture(false);
      if (batch$3.isEmpty()) { batch$3.kill(); }
      else { this.enqueue(CommandKind.STROKE, batch$3); }
      this.buffers.stroke = null;
    }
    else if (this.modes.select) {
      this.states.selecting = false;
      this.redraw = true;
    }
    else if (this.states.drawing) {
      var batch$4 = this.buffers.drawing;
      batch$4.forceRendering = false;
      batch$4.resizeByMatrixData();
      this.states.drawing = false;
      this.enqueue(CommandKind.DRAW, batch$4);
      this.buffers.drawing = null;
    }
    else if (this.states.erasing) {
      var batch$5 = this.buffers.erasing;
      batch$5.forceRendering = false;
      batch$5.resizeByMatrixData();
      this.states.erasing = false;
      if (batch$5.isEmpty()) { batch$5.kill(); }
      else { this.enqueue(CommandKind.ERASE, batch$5); }
      this.buffers.erasing = null;
    }
    else if (this.states.lighting) {
      var batch$6 = this.buffers.lighting;
      batch$6.forceRendering = false;
      batch$6.resizeByMatrixData();
      this.states.lighting = false;
      if (batch$6.isEmpty()) { batch$6.kill(); }
      else { this.enqueue(CommandKind.LIGHTING, batch$6); }
      this.buffers.lighting = null;
    }
    else if (this.states.pipette) {
      this.states.pipette = false;
    }
  }
  if (e.which === 3) {
    this.states.dragging = false;
  }
}

/**
 * @param {Event} e
 */
function onKeyDown(e) {
  var code = e.keyCode;
  var target = e.target;
  if (target !== document.body) {
    return;
  }
  e.preventDefault();
  this.keys[code] = 1;
  switch (code) {
    // ctrl
    case 17:
      if (this.modes.light) {
        // lighting mode is darken
        SETTINGS.LIGHTING_MODE = -(Math.abs(SETTINGS.LIGHTING_MODE));
        lighting.src = LIGHT_DARKEN_IMG_PATH;
      }
    break;
    // del
    case 46:
      this.clearSelection(this.getSelection());
      this.resetSelection();
    break;
    // c | ctrl+c
    case 67:
      if (this.keys[17]) {
        this.copy(this.getSelection());
      }
    break;
    // x | ctrl+x
    case 88:
      if (this.keys[17]) {
        this.cut(this.getSelection());
        this.resetSelection();
      }
    break;
    // v + ctrl+v
    case 86:
      if (this.keys[17]) {
        this.pasteAt(this.last.mx, this.last.my, this.getSelection());
        this.resetSelection();
      }
    break;
    // z | ctr+z
    case 90:
      if (this.keys[17]) {
        this.undo();
      }
    break;
    // y | ctrl+y
    case 89:
      if (this.keys[17]) {
        this.redo();
      }
    break;
    // f2
    case 113:
      MODES.DEV = !MODES.DEV;
      this.redraw = true;
    break;
    // f5
    case 116:
      location.reload();
    break;
    // space
    case 32:
      // already open, close so
      if (this.states.fastColorMenu) {
        this.closeFastColorPickerMenu();
        return;
      }
      var width = menu.clientWidth;
      var height = menu.clientHeight;
      var btmWidth = document.querySelector(".bottom-menu").clientHeight;
      var yy = lasty;
      var xx = (lastx - (width / 2) | 0);
      // invert menu position since we are out of window view
      if (yy + height > stage.ch - btmWidth) {
        yy = yy - height;
      }
      menu.style.top = yy + "px";
      menu.style.left = xx + "px";
      this.openFastColorPickerMenu();
    break;
    default:
      return;
    break;
  }
}

/**
 * @param {Event} e
 */
function onKeyUp(e) {
  e.preventDefault();
  var code = e.keyCode;
  this.keys[code] = 0;
  switch (code) {
    // ctrl
    case 17:
      // lighting mode is lighten
      if (this.modes.light) {
        SETTINGS.LIGHTING_MODE = Math.abs(SETTINGS.LIGHTING_MODE);
        lighting.src = LIGHT_LIGHTEN_IMG_PATH;
      }
    break;
  }
}

/**
 * @param {Event} e
 */
function onContextmenu(e) {
  e.preventDefault();
}

/**
 * @param {Event} e
 */
function onMouseWheel(e) {
  if (!(e.target instanceof HTMLCanvasElement)) { return; }
  e.preventDefault();
  var x = e.clientX;
  var y = e.clientY;
  var value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
  this.hover(x, y);
}


var _listener = Object.freeze({
	initListeners: initListeners,
	onResize: onResize,
	onMouseOut: onMouseOut,
	onMouseLeave: onMouseLeave,
	resetListElementsActiveState: resetListElementsActiveState,
	onColorMenuClick: onColorMenuClick,
	processUIClick: processUIClick,
	onMouseDown: onMouseDown,
	onMouseMove: onMouseMove,
	onMouseUp: onMouseUp,
	onKeyDown: onKeyDown,
	onKeyUp: onKeyUp,
	onContextmenu: onContextmenu,
	onMouseWheel: onMouseWheel
});

/**
 * @class Boundings
 */
var Boundings = function Boundings(x, y, w, h) {
  if ( x === void 0 ) x = 0;
  if ( y === void 0 ) y = 0;
  if ( w === void 0 ) w = 0;
  if ( h === void 0 ) h = 0;

  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.h = 0;
  this.update(x, y, w, h);
};

/**
 * @return {Boundings}
 */
Boundings.prototype.clone = function() {
  var bounds = new Boundings(
    this.x, this.y, this.w, this.h
  );
  return (bounds);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
Boundings.prototype.update = function(x, y, w, h) {
  x = x | 0;
  y = y | 0;
  w = w | 0;
  h = h | 0;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
Boundings.prototype.isPointInside = function(x, y) {
  x = x | 0;
  y = y | 0;
  var state = intersectRectangles(
    this.x, this.y, this.w - 1, this.h - 1,
    x, y, 0, 0
  );
  return (state);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 * @param {Array} color 
 */
function drawAt(x, y, size, color) {
  var xpad = Math.floor(size / 2);
  var ypad = Math.floor(size / 2);
  this.fillRect(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
function fillRect(x, y, w, h, color) {
  var this$1 = this;

  for (var ii = 0; ii < w * h; ++ii) {
    var xx = (ii % w) + x;
    var yy = ((ii / w) | 0) + y;
    this$1.drawPixel(xx, yy, color);
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function drawPixel(x, y, color) {
  this.resizeByOffset(x, y);
  this.drawPixelFast(x, y, color);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function drawPixelFast(x, y, color) {
  var data = this.data;
  var rdata = this.reverse;
  var dx = x - this.layer.x;
  var dy = y - this.layer.y;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  var idx = 4 * (yy * this.bounds.w + xx);
  var pixel = this.layer.getPixelAt(x, y);
  // save earlier pixel state into reverse matrix
  if (rdata[idx + 3] <= 0 && pixel !== null) {
    rdata[idx + 0] = pixel[0];
    rdata[idx + 1] = pixel[1];
    rdata[idx + 2] = pixel[2];
    rdata[idx + 3] = rgbAlphaToAlphaByte(pixel[3]);
  }
  // overwrite pixel
  data[idx + 0] = color[0];
  data[idx + 1] = color[1];
  data[idx + 2] = color[2];
  data[idx + 3] = rgbAlphaToAlphaByte(color[3]);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 */
function clearAt(x, y, size) {
  var xpad = Math.floor(size / 2);
  var ypad = Math.floor(size / 2);
  this.clearRect(
    x - xpad, y - ypad,
    size + xpad, size + ypad,
    color
  );
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
function clearRect(x, y, w, h) {
  var this$1 = this;

  for (var ii = 0; ii < w * h; ++ii) {
    var xx = (ii % w) + x;
    var yy = ((ii / w) | 0) + y;
    this$1.erasePixel(xx, yy);
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
function erasePixel(x, y) {
  var pixel = this.layer.getPixelAt(x, y);
  // nothing to erase
  if (pixel === null) { return; }
  this.resizeByOffset(x, y);
  this.erasePixelFast(x, y, pixel);
  return;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} pixel - Earlier pixel
 */
function erasePixelFast(x, y, pixel) {
  var data = this.data;
  var rdata = this.reverse;
  var dx = x - this.layer.x;
  var dy = y - this.layer.y;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  var idx = 4 * (yy * this.bounds.w + xx);
  // save old pixel into reverse matrix if not set yet
  if (rdata[idx + 3] <= 0) {
    rdata[idx + 0] = pixel[0];
    rdata[idx + 1] = pixel[1];
    rdata[idx + 2] = pixel[2];
    rdata[idx + 3] = rgbAlphaToAlphaByte(pixel[3]);
  }
  // reset pixel data
  data[idx + 0] = 255;
  data[idx + 1] = 255;
  data[idx + 2] = 255;
  data[idx + 3] = 255;
}


var _tile = Object.freeze({
	drawAt: drawAt,
	fillRect: fillRect,
	drawPixel: drawPixel,
	drawPixelFast: drawPixelFast,
	clearAt: clearAt,
	clearRect: clearRect,
	erasePixel: erasePixel,
	erasePixelFast: erasePixelFast
});

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 */
function resizeRectangular(x, y, w, h) {
  this.resizeByOffset(x, y);
  this.resizeByOffset(x + w, y + h);
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function resizeByOffset(x, y) {
  var bounds = this.bounds;
  var bx = bounds.x; var by = bounds.y;
  var dx = x - this.layer.x;
  var dy = y - this.layer.y;
  var w = (Math.abs(bx - dx) | 0) + 1;
  var h = (Math.abs(by - dy) | 0) + 1;
  var ox = bx; var oy = by;
  var ow = bounds.w; var oh = bounds.h;
  var xx = -(bx - dx) | 0;
  var yy = -(by - dy) | 0;
  // resize bound rect to left, top
  if (xx < 0) {
    bx += xx - BATCH_JUMP_RESIZE;
    bounds.w += Math.abs(xx) + BATCH_JUMP_RESIZE;
  }
  if (yy < 0) {
    by += yy - BATCH_JUMP_RESIZE;
    bounds.h += Math.abs(yy) + BATCH_JUMP_RESIZE;
  }
  // resize bound to right, bottom
  if (w > bounds.w) { bounds.w = w + BATCH_JUMP_RESIZE; }
  if (h > bounds.h) { bounds.h = h + BATCH_JUMP_RESIZE; }
  bounds.x = bx; bounds.y = by;
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    this.resizeMatrix(
      ox - bx, oy - by,
      bounds.w - ow, bounds.h - oh
    );
  }
}

/**
 * Resizes matrix by calculating min/max of x,y,w,h
 * @return {Void}
 */
function resizeByMatrixData() {
  var data = this.data;
  var bounds = this.bounds;
  var bx = bounds.x; var by = bounds.y;
  var bw = bounds.w; var bh = bounds.h;
  var ox = bounds.x; var oy = bounds.y;
  var ow = bounds.w; var oh = bounds.h;
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var count = 0;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % bw) | 0;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    var r = data[px + 0];
    var g = data[px + 1];
    var b = data[px + 2];
    var a = data[px + 3];
    // ignore empty tiles
    if (a <= 0) { continue; }
    // x, y
    if (xx >= 0 && xx <= x) { x = xx; }
    if (yy >= 0 && yy <= y) { y = yy; }
    // width, height
    if (xx >= 0 && xx >= w) { w = xx; }
    if (yy >= 0 && yy >= h) { h = yy; }
    count++;
  }
  var nx = (w - (-x + w));
  var ny = (h - (-y + h));
  var nbx = bounds.x + nx; var nby = bounds.y + ny;
  var nbw = (-x + w) + 1; var nbh = (-y + h) + 1;
  // abort if nothing has changed
  if (count <= 0) { return; }
  if (ox === nbx && oy === nby && ow === nbw && oh === nbh) { return; }
  bounds.x = nbx; bounds.y = nby;
  bounds.w = nbw; bounds.h = nbh;
  this.resizeMatrix(
    ox - nbx, oy - nby,
    nbw - ow, nbh - oh
  );
  return;
}

/**
 * Resize internal array buffers
 * and join old matrix with new one
 * @param {Number} x - Resize left
 * @param {Number} y - Resize top
 * @param {Number} w - Resize right
 * @param {Number} h - Resize bottom
 * @return {Void}
 */
function resizeMatrix(x, y, w, h) {
  var data = this.data;
  var rdata = this.reverse;
  var nw = this.bounds.w; var nh = this.bounds.h;
  var ow = nw - w; var oh = nh - h;
  var size = 4 * (nw * nh);
  var buffer = new Uint8Array(size);
  var reverse = new Uint8Array(size);
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % ow) | 0;
    var yy = (idx / ow) | 0;
    var opx = (yy * ow + xx) * 4;
    // black magic 🦄
    var npx = opx + (yy * (nw - ow) * 4) + (x * 4) + ((y * 4) * nw);
    if (data[opx + 3] <= 0) { continue; }
    // refill data
    buffer[npx + 0] = data[opx + 0];
    buffer[npx + 1] = data[opx + 1];
    buffer[npx + 2] = data[opx + 2];
    buffer[npx + 3] = data[opx + 3];
    if (rdata[opx + 3] <= 0) { continue; }
    // refill reverse data
    reverse[npx + 0] = rdata[opx + 0];
    reverse[npx + 1] = rdata[opx + 1];
    reverse[npx + 2] = rdata[opx + 2];
    reverse[npx + 3] = rdata[opx + 3];
  }
  this.data = buffer;
  this.reverse = reverse;
  this.refreshTexture(true);
  return;
}

/**
 * Merges given matrix
 * @param {Batch} batch
 * @param {Number} px - X-offset to merge at
 * @param {Number} py - Y-offset to merge at
 * @param {Boolean} state - Add or reverse
 */
function injectMatrix(batch, state) {
  var buffer = this.data;
  var isEraser = batch.isEraser;
  var data = state ? batch.data : batch.reverse;
  var bw = batch.bounds.w | 0;
  var bx = (this.bounds.x) | 0;
  var by = (this.bounds.y) | 0;
  var dx = (batch.bounds.x - bx) | 0;
  var dy = (batch.bounds.y - by) | 0;
  var w = this.bounds.w | 0; var h = this.bounds.h | 0;
  var x = bx | 0; var y = by | 0;
  // loop given batch data and merge it with our main matrix
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % bw) | 0;
    var yy = (idx / bw) | 0;
    var opx = ((yy * bw + xx) * 4) | 0;
    var npx = (opx + (yy * (w - bw) * 4) + (dx * 4) + ((dy * 4) * w)) | 0;
    var alpha = data[opx + 3] | 0;
    // erase pixel
    if (isEraser === true) {
      if (state === true && alpha > 0) {
        buffer[npx + 0] = buffer[npx + 1] = buffer[npx + 2] = buffer[npx + 3] = 0;
        continue;
      }
    }
    // ignore empty data pixels
    if (alpha <= 0 && state === true) { continue; }
    // only overwrite the reverse batch's used pixels
    if (state === false && alpha <= 0 && batch.data[opx + 3] <= 0) { continue; }
    // manual color blending
    if (buffer[npx + 3] > 0 && alpha < 255 && alpha > 0) {
      // redo, additive blending
      if (state === true) {
        var src = buffer.subarray(npx, npx + 4);
        var dst = data.subarray(opx, opx + 4);
        var color = additiveAlphaColorBlending(src, dst);
        buffer[npx + 0] = color[0];
        buffer[npx + 1] = color[1];
        buffer[npx + 2] = color[2];
        buffer[npx + 3] = color[3];
        continue;
      // undo, reverse blending
    } else {
        var src$1 = buffer.subarray(npx, npx + 4);
        var dst$1 = data.subarray(opx, opx + 4);
        var color$1 = additiveAlphaColorBlending(src$1, dst$1);
        buffer[npx + 0] = color$1[0];
        buffer[npx + 1] = color$1[1];
        buffer[npx + 2] = color$1[2];
        buffer[npx + 3] = color$1[3];
        continue;
      }
    }
    // just fill colors with given batch data kind
    buffer[npx + 0] = data[opx + 0];
    buffer[npx + 1] = data[opx + 1];
    buffer[npx + 2] = data[opx + 2];
    buffer[npx + 3] = data[opx + 3];
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRawPixelAt(x, y) {
  // normalize coordinates
  var xx = x - (this.bounds.x);
  var yy = y - (this.bounds.y);
  // now extract the data
  var data = this.data;
  // imagedata array is 1d
  var idx = (yy * this.bounds.w + xx) * 4;
  // pixel index out of bounds
  if (idx < 0 || idx >= data.length) { return (null); }
  // get each color value
  var r = data[idx + 0];
  var g = data[idx + 1];
  var b = data[idx + 2];
  var a = data[idx + 3];
  // dont return anything if we got no valid color
  if (a <= 0) { return (null); }
  var color = [r, g, b, alphaByteToRgbAlpha(a)];
  // finally return the color array
  return (color);
}

/**
 * Clears all pixels non-reversible
 */
function clear() {
  var data = this.data;
  for (var ii = 0; ii < data.length; ++ii) {
    data[ii] = 0;
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function prepareMatrix(x, y) {
  var bounds = this.bounds;
  // we don't have a buffer to store data at yet
  if (this.data === null) {
    bounds.x = x;
    bounds.y = y;
    bounds.w = 1;
    bounds.h = 1;
    var size = 4 * (bounds.w * bounds.h);
    this.data = new Uint8Array(size);
    this.reverse = new Uint8Array(size);
    this.texture = this.instance.bufferTexture(this.id, this.data, bounds.w, bounds.h);
  }
}

/**
 * Returns the very first found pixel color
 * *We expect that the batch is single colored*
 * @return {Uint8Array}
 */
function getBatchColor() {
  var data = this.data;
  var bounds = this.bounds;
  var bw = bounds.w; var bh = bounds.h;
  var color = new Uint8Array(4);
  // calculate batch color
  for (var ii = 0; ii < bw * bh; ++ii) {
    var xx = (ii % bw) | 0;
    var yy = (ii / bw) | 0;
    var px = 4 * (yy * bw + xx);
    if (data[px + 3] <= 0) { continue; }
    color[0] = data[px + 0];
    color[1] = data[px + 1];
    color[2] = data[px + 2];
    color[3] = data[px + 3];
    break;
  }
  return (color);
}

/**
 * @return {Boolean}
 */
function isEmpty() {
  var data = this.data;
  var bw = this.bounds.w;
  var count = 0;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % bw) | 0;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    var a = data[px + 3];
    // ignore empty tiles
    if (a <= 0) { continue; }
    count++;
  }
  return (count <= 0);
}


var _matrix = Object.freeze({
	resizeRectangular: resizeRectangular,
	resizeByOffset: resizeByOffset,
	resizeByMatrixData: resizeByMatrixData,
	resizeMatrix: resizeMatrix,
	injectMatrix: injectMatrix,
	getRawPixelAt: getRawPixelAt,
	clear: clear,
	prepareMatrix: prepareMatrix,
	getBatchColor: getBatchColor,
	isEmpty: isEmpty
});

/**
 * Shade or tint
 * @param {Number} x
 * @param {Number} y
 * @param {Number} factor
 */
function applyColorLightness(x, y, factor) {
  var this$1 = this;

  var instance = this.instance;
  var bounds = this.bounds;
  var layer = this.layer;
  var w = SETTINGS.LIGHT_SIZE;
  var h = SETTINGS.LIGHT_SIZE;
  for (var ii = 0; ii < w * h; ++ii) {
    var xx = x + (ii % w) | 0;
    var yy = y + (ii / w) | 0;
    var pixel = layer.getLivePixelAt(xx, yy);
    if (pixel === null) { continue; }
    var t = factor < 0 ? 0 : 255;
    var p = factor < 0 ? -factor : factor;
    var r = (Math.round((t - pixel[0]) * p) + pixel[0]);
    var g = (Math.round((t - pixel[1]) * p) + pixel[1]);
    var b = (Math.round((t - pixel[2]) * p) + pixel[2]);
    var a = pixel[3];
    this$1.drawPixel(xx, yy, [r, g, b, a]);
  }
}


var _blend = Object.freeze({
	applyColorLightness: applyColorLightness
});



var _invert = Object.freeze({

});



var _onion = Object.freeze({

});



var _replace = Object.freeze({

});



var _shading = Object.freeze({

});

/**
 * Remove L shaped corners
 * http://deepnight.net/pixel-perfect-drawing/
 * @param {Batch} batch
 */
function applyPixelSmoothing(batch) {
  var bw = batch.bounds.w;
  var bh = batch.bounds.h;
  var tiles = batch.data;
  for (var ii = 0; ii < tiles.length; ii += 4) {
    if (!(ii > 0 && ii + 1 < tiles.length)) { continue; }
    var x = (ii % bw);
    var y = (ii / bw) | 0;
    var px = (yy * bw + xx) * 4;
    if (
      (w.x === o.x  || w.y === o.y) &&
      (e.x === o.x  || e.y === o.y) &&
      (w.x !== e.x) && (w.y !== e.y)
    ) {
      tiles[ii + 0] = 0;
      tiles[ii + 1] = 0;
      tiles[ii + 2] = 0;
      tiles[ii + 3] = 0;
    }
  }
}


var _smoothing = Object.freeze({
	applyPixelSmoothing: applyPixelSmoothing
});

/**
 * @class Batch
 */
var Batch = function Batch(instance) {
  this.id = uid();
  // save reference to layer
  this.layer = null;
  // reference to stage
  this.instance = instance;
  // data related
  this.data = null;
  this.reverse = null;
  // buffer related
  // used for canvas batches
  this.buffer = null;
  // wgl texture
  // TODO: textures can possibly get from gpu as soon as mouseUp event passed
  this.texture = null;
  // relative boundings
  this.bounds = new Boundings();
  // we use this batch for erasing
  this.isEraser = false;
  // we use this batch for moving
  this.isMover = false;
  this.position = { x: 0, y: 0, mx: 0, my: 0 };
  // indicates if we should force to render this batch
  // even when it is not registered inside our stack yet
  this.forceRendering = false;
};

/**
 * @return {Batch}
 */
Batch.prototype.clone = function() {
  var batch = new Batch(this.instance);
  batch.prepareMatrix(this.bounds.x, this.bounds.y);
  // clone props
  batch.layer = this.layer;
  batch.buffer = this.buffer;
  batch.bounds = this.bounds.clone();
  batch.isEraser = this.isEraser;
  batch.isMover = this.isMover;
  batch.position = Object.assign(this.position);
  batch.forceRendering = this.forceRendering;
  // clone matrices
  batch.data = new Uint8Array(this.data);
  batch.reverse = new Uint8Array(this.reverse);
  batch.refreshTexture(true);
  return (batch);
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.move = function(x, y) {
  var xx = x - this.position.mx;
  var yy = y - this.position.my;
  this.position.x += xx;
  this.position.y += yy;
  this.layer.x += xx;
  this.layer.y += yy;
  this.position.mx = x;
  this.position.my = y;
};

/**
 * @return {Number}
 */
Batch.prototype.getStackIndex = function() {
  var id = this.id;
  var commands = this.instance.stack;
  for (var ii = 0; ii < commands.length; ++ii) {
    var cmd = commands[ii];
    if (cmd.batch.id === id) { return (ii); }
  }
  return (-1);
};

Batch.prototype.kill = function() {
  var id = this.id;
  var instance = this.instance;
  var layers = instance.layers;
  // free batch from memory
  this.bounds = null;
  this.buffer = null;
  this.data = null;
  this.reverse = null;
  this.instance.destroyTexture(this.texture);
  // finally remove batch from layer
  var count = 0;
  for (var ii = 0; ii < layers.length; ++ii) {
    var batches = layers[ii].batches;
    for (var jj = 0; jj < batches.length; ++jj) {
      var batch = batches[jj];
      if (batch.id === id) {
        batches.splice(jj, 1);
        layers[ii].updateBoundings();
        count++;
      }
    }
  }
  /*if (count <= 0 && !this.isMover) {
    throw new Error(`Failed to kill batch:${this.id}`);
  }*/
};

/**
 * @param {Boolean} state
 */
Batch.prototype.refreshTexture = function(resized) {
  var bounds = this.bounds;
  var bw = bounds.w; var bh = bounds.h;
  var instance = this.instance;
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

extend(Batch, _tile);
extend(Batch, _matrix);

extend(Batch, _blend);
extend(Batch, _invert);
extend(Batch, _onion);
extend(Batch, _replace);
extend(Batch, _shading);
extend(Batch, _smoothing);

/**
 * @return {Boolean}
 */
function hasResized() {
  var ox = this.bounds.x; var oy = this.bounds.y;
  var ow = this.bounds.w; var oh = this.bounds.h;
  var nx = this.last.x; var ny = this.last.y;
  var nw = this.last.w; var nh = this.last.h;
  return (
    ox !== nx || oy !== ny ||
    ow !== nw || oh !== nh
  );
}

function updateBoundings() {
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var batches = this.batches;
  var count = 0;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    var bounds = batch.bounds;
    var bx = bounds.x; var by = bounds.y;
    var bw = bx + bounds.w; var bh = by + bounds.h;
    // ignore empty batches
    if (bounds.w === 0 && bounds.h === 0) { continue; }
    // calculate x
    if (x < 0 && bx < x) { x = bx; }
    else if (x >= 0 && (bx < 0 || bx < x)) { x = bx; }
    // calculate y
    if (y < 0 && by < y) { y = by; }
    else if (y >= 0 && (by < 0 || by < y)) { y = by; }
    // calculate width
    if (bw > w) { w = bw; }
    // calculate height
    if (bh > h) { h = bh; }
    count++;
  }
  // update our boundings
  if (count > 0) {
    var bounds$1 = this.bounds;
    this.last.x = bounds$1.x; this.last.y = bounds$1.y;
    this.last.w = bounds$1.w; this.last.h = bounds$1.h;
    bounds$1.update(
      x, y,
      -x + w, -y + h
    );
  }
  if (this.hasResized()) {
    var main = this.batch;
    main.bounds.update(
      this.bounds.x, this.bounds.y,
      this.bounds.w, this.bounds.h
    );
    var xx = this.last.x; var yy = this.last.y;
    var ww = this.last.w; var hh = this.last.h;
    main.resizeMatrix(
      xx - this.bounds.x, yy - this.bounds.y,
      this.bounds.w - ww, this.bounds.h - hh
    );
  }
}

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getPixelAt(x, y) {
  var bw = this.bounds.w;
  var bh = this.bounds.h;
  // normalize coordinates
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  // now get the pixel from the layer matrix
  return (this.batch.getRawPixelAt(dx, dy));
}

/**
 * Access live pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getLivePixelAt(x, y) {
  var this$1 = this;

  var bw = this.bounds.w;
  var bh = this.bounds.h;
  // normalize coordinates
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  for (var ii = 0; ii < this.batches.length; ++ii) {
    var idx = (this$1.batches.length - 1) - ii;
    var batch = this$1.batches[idx];
    var pixel = batch.getRawPixelAt(dx, dy);
    if (pixel !== null) { return (pixel); }
  }
  return (null);
}

/**
 * Merges two layers
 * Resize this by layer<->this bounding diff
 * Inject this matrix into layer matrix at layer bound pos
 * @param {Layer} layer
 */
function mergeWithLayer(layer, state) {
  this.batches.push(layer.batch);
  this.updateBoundings();
  this.batch.injectMatrix(layer.batch, state);
  this.batch.refreshTexture(true);
}


var _matrix$1 = Object.freeze({
	hasResized: hasResized,
	updateBoundings: updateBoundings,
	getPixelAt: getPixelAt,
	getLivePixelAt: getLivePixelAt,
	mergeWithLayer: mergeWithLayer
});

/**
 * @class {Layer}
 */
var Layer = function Layer(instance) {
  this.id = uid();
  this.instance = instance;
  // position
  this.x = 0;
  this.y = 0;
  // last boundings
  this.last = { x: 0, y: 0, w: 0, h: 0 };
  // we can name layers
  this.index = this.generateLayerNameIndex();
  this._name = "Layer " + this.index;
  // reference to ui node
  this.node = null;
  // opacity applied over local batches
  this.opacity = 255.0;
  // layer batch matrix
  this.batch = null;
  // batches we hold here
  this.batches = [];
  // relative boundings
  this.bounds = new Boundings();
  // layer states get/set base
  this._visible = true;
  this._locked = false;
  this.allocateLayerMatrix();
};

var prototypeAccessors = { name: {},visible: {},locked: {} };
/**
 * @return {String}
 */
prototypeAccessors.name.get = function () {
  return (this._name);
};
/**
 * @param {String}
 */
prototypeAccessors.name.set = function (value) {
  this._name = value;
  var node = this.node.querySelector(".layer-text");
  node.value = value;
};
/**
 * @return {Boolean}
 */
prototypeAccessors.visible.get = function () {
  return (this._visible);
};
/**
 * @param {Boolean} state
 */
prototypeAccessors.visible.set = function (state) {
  this._visible = state;
  this.instance.redraw = true;
  var node = this.node.querySelector(".layer-item-visible");
  node.src = state ? "assets/img/visible.png" : "assets/img/invisible.png";
};
/**
 * @return {Boolean}
 */
prototypeAccessors.locked.get = function () {
  return (this._locked);
};
/**
 * @param {Boolean} state
 */
prototypeAccessors.locked.set = function (state) {
  this._locked = state;
  this.instance.redraw = true;
  var node = this.node.querySelector(".layer-item-locked");
  node.src = state ? "assets/img/locked.png" : "assets/img/unlocked.png";
};

Object.defineProperties( Layer.prototype, prototypeAccessors );

Layer.prototype.allocateLayerMatrix = function() {
  var instance = this.instance;
  this.batch = instance.createDynamicBatch(0, 0);
  // add reference to unused layer so we can use
  // the batch matrix logic for our layers too
  // but without including layer x,y in calculations
  this.batch.layer = instance.cache.layer;
};

/**
 * @return {Layer}
 */
Layer.prototype.clone = function() {
  var layer = new Layer(this.instance);
  var batch = this.batch.clone();
  layer.last = Object.assign(layer.last);
  layer.opacity = this.opacity;
  layer.bounds = this.bounds.clone();
  layer.x = this.x; layer.y = this.y;
  layer.batch = batch;
  layer.batches.push(batch);
  //layer.visible = this.visible;
  //layer.locked = this.locked;
  return (layer);
};

/**
 * @return {Number}
 */
Layer.prototype.getIndex = function() {
  var this$1 = this;

  var layers = this.instance.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    if (this$1.id === layer.id) { return (ii); }
  }
  return (-1);
};

Layer.prototype.removeFromLayers = function() {
  var this$1 = this;

  var layers = this.instance.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    if (this$1.id === layer.id) { layers.splice(ii, 1); }
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
Layer.prototype.createBatchAt = function(x, y) {
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var batch = new Batch(this.instance);
  batch.prepareMatrix(dx, dy);
  this.addBatch(batch);
  return (batch);
};

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer.prototype.addBatch = function(batch) {
  batch.layer = this;
  this.batches.push(batch);
};

/**
 * @param {Number} id
 * @return {Number}
 */
Layer.prototype.getBatchById = function(id) {
  var result = null;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    if (batch.id === id) {
      result = batch;
      break;
    }
  }
  return (result);
};

/**
 * Auto generates a layer index name
 * and filles missing layer indices
 * @return {Number}
 */
Layer.prototype.generateLayerNameIndex = function() {
  var layers = this.instance.layers;
  // clone, take numeric index, sort ascending, es6 left its muck here
  var sorted = layers.concat().map(function (item) { return item.index; }).sort(function (a, b) { return a - b; });
  for (var ii = 0; ii < sorted.length; ++ii) {
    if (sorted.indexOf(ii) < 0) { return (ii); }
  }
  return (layers.length);
};

/**
 * yuck in here, yuck in here
 */
Layer.prototype.addUiReference = function() {
  var tmpl = "\n    <div class=\"layer-item\">\n      <img class=\"layer-item-visible\" src=\"assets/img/visible.png\">\n      <img class=\"layer-item-locked\" src=\"assets/img/unlocked.png\">\n      <input class=\"layer-text\" value=\"" + (this.name) + "\" readonly />\n    </div>\n  ";
  var parser = new DOMParser();
  var html = parser.parseFromString(tmpl, "text/html").querySelector(".layer-item");
  var index = this.getIndex();
  var layers = this.instance.layers;
  var ctx = window.layers;
  if (index >= ctx.children.length) {
    window.layers.appendChild(html);
  } else {
    window.layers.insertBefore(html, ctx.children[index]);
  }
  // save reference to inserted layer node
  this.node = html;
};

Layer.prototype.removeUiReference = function() {
  this.node.parentNode.removeChild(this.node);
  this.node = null;
};

extend(Layer, _matrix$1);

/**
 * @return {Boolean}
 */
function isInActiveState() {
  var states = this.states;
  for (var key in states) {
    // ignore dragging state
    if (key === "dragging") { continue; }
    if (states[key]) { return (true); }
  }
  return (false);
}

/**
 * @param {Number} id
 * @return {Batch}
 */
function getBatchById(id) {
  var result = null;
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var idx = layers.length - 1 - ii;
    var layer = layers[idx];
    var batch = layer.getBatchById(id);
    if (batch !== null) {
      result = batch;
      break;
    }
  }
  return (result);
}

/**
 * @return {Layer}
 */
function addLayer() {
  var layer = new Layer(this);
  layer.addUiReference();
  this.layers.push(layer);
  return (layer);
}

/**
 * @return {Layer}
 */
function getCurrentLayer() {
  return (this.activeLayer || null);
}

/**
 * @param {HTMLElement} node
 * @return {Layer}
 */
function getLayerByNode(node) {
  var this$1 = this;

  for (var ii = 0; ii < this.layers.length; ++ii) {
    var layer = this$1.layers[ii];
    if (layer.node === node) { return (layer); }
  }
  return (null);
}

/**
 * @param {Number} index
 * @return {Layer}
 */
function getLayerByIndex(index) {
  return (this.layers[index] || null);
}

/**
 * @param {Layer} layer
 */
function setActiveLayer(layer) {
  var old = this.getCurrentLayer();
  if (old && old.node) {
    old.node.classList.remove("selected");
  }
  if (layer) { layer.node.classList.add("selected"); }
  this.activeLayer = layer;
  this.redraw = true;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
function getLayerByPoint(x, y) {
  var layers = this.layers;
  var last = null;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    var xx = x - layer.x;
    var yy = y - layer.y;
    if (layer.locked) { continue; }
    if (layer.bounds.isPointInside(xx, yy)) {
      last = layer;
      if (layer.getPixelAt(x, y)) {
        return (layer);
      }
    }
  }
  return (last);
}

/**
 * Get batch to insert at by current active state
 * @return {Batch}
 */
function getCurrentDrawingBatch() {
  var this$1 = this;

  for (var key in this.states) {
    var state = this$1.states[key];
    if (state === true && this$1.buffers[key]) {
      return (this$1.buffers[key]);
    }
  }
  return (null);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
function createDynamicBatch(x, y) {
  var batch = new Batch(this);
  batch.prepareMatrix(x, y);
  return (batch);
}

/**
 * Get absolute pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getAbsolutePixelAt(x, y) {
  // normalize coordinates
  var bw = this.bounds.w;
  var bh = this.bounds.h;
  var xx = x - this.bounds.x;
  var yy = y - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  // go through each layer reversed
  // and search for the given pixel
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var pixel = layers[ii].getPixelAt(x, y);
    if (pixel !== null) { return (pixel); }
  }
  return (null);
}

/**
 * Get layer relative pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRelativePixelAt(x, y) {
  // normalize coordinates
  var bw = this.bounds.w;
  var bh = this.bounds.h;
  var xx = x - this.bounds.x;
  var yy = y - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  // search for the pixel at given layer
  var layer = this.getCurrentLayer();
  if (layer !== null) {
    return (layer.getPixelAt(x, y));
  }
  return (null);
}

function updateGlobalBoundings() {
  var layers = this.layers;
  var bounds = this.bounds;
  var x = MAX_SAFE_INTEGER;  var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var count = 0;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    layer.updateBoundings();
    var bounds$1 = layer.bounds;
    var bx = layer.x + bounds$1.x; var by = layer.y + bounds$1.y;
    var bw = bx + bounds$1.w; var bh = by + bounds$1.h;
    // ignore empty layers
    if (bounds$1.w === 0 && bounds$1.h === 0) { continue; }
    // calculate x
    if (x < 0 && bx < x) { x = bx; }
    else if (x >= 0 && (bx < 0 || bx < x)) { x = bx; }
    // calculate y
    if (y < 0 && by < y) { y = by; }
    else if (y >= 0 && (by < 0 || by < y)) { y = by; }
    // calculate width
    if (bw > w) { w = bw; }
    // calculate height
    if (bh > h) { h = bh; }
    count++;
  }
  // update our boundings
  if (count > 0) {
    //this.updateSelectionMatrix();
    this.bounds.update(x, y, -x + w, -y + h);
  }
}

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive cells" in the grid,
 * then we take the boundings of the used area of our grid and crop out
 * the relevant part. Next we can process each tile=^2 traced as inside shape
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @return {Uint8Array}
 */
function getBinaryShape(x, y, base) {
  var layer = this.getCurrentLayer();
  var bounds = layer.bounds;
  var bx = layer.x + bounds.x; var by = layer.y + bounds.y;
  var bw = bounds.w; var bh = bounds.h;
  var isEmpty = base[3] === 0;
  var gridl = bw * bh;
  // allocate and do a basic fill onto the grid
  var grid = new Uint8Array(bw * bh);
  for (var ii = 0; ii < gridl; ++ii) {
    var xx = ii % bw;
    var yy = (ii / bw) | 0;
    var color = layer.getPixelAt(bx + xx, by + yy);
    // empty tile based
    if (isEmpty) { if (color !== null) { continue; } }
    // color based
    else {
      if (color === null) { continue; }
      if (!(base[0] === color[0] && base[1] === color[1] && base[2] === color[2])) { continue; }
    }
    // fill tiles with 1's if we got a color match
    grid[yy * bw + xx] = 1;
  }
  // trace connected tiles by [x,y]=2
  var queue = [{x: x - bx, y: y - by}];
  while (queue.length > 0) {
    var point = queue.pop();
    var x$1 = point.x; var y$1 = point.y;
    var idx = y$1 * bw + x$1;
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) { grid[idx] = 2; }
    var nn = (y$1-1) * bw + x$1;
    var ee = y$1 * bw + (x$1+1);
    var ss = (y$1+1) * bw + x$1;
    var ww = y$1 * bw + (x$1-1);
    if (grid[nn] === 1) { queue.push({x: x$1, y:y$1-1}); }
    if (grid[ee] === 1) { queue.push({x:x$1+1, y: y$1}); }
    if (grid[ss] === 1) { queue.push({x: x$1, y:y$1+1}); }
    if (grid[ww] === 1) { queue.push({x:x$1-1, y: y$1}); }
  }
  return (grid);
}

/**
 * @return {Number}
 */
function getCursorSize() {
  var this$1 = this;

  for (var key in this.modes) {
    if (!this$1.modes[key]) { continue; }
    switch (key) {
      case "arc":
      case "draw":
      case "rect":
      case "stroke":
        return (SETTINGS.PENCIL_SIZE);
      break;
      case "erase":
        return (SETTINGS.ERASER_SIZE);
      break;
      case "light":
        return (SETTINGS.LIGHT_SIZE);
      break;
      case "move":
      case "fill":
      case "shape":
      case "flood":
      case "select":
        return (1);
      break;
      case "pipette":
        return (1);
      break;
    }
  }
  return (1);
}


var _env = Object.freeze({
	isInActiveState: isInActiveState,
	getBatchById: getBatchById,
	addLayer: addLayer,
	getCurrentLayer: getCurrentLayer,
	getLayerByNode: getLayerByNode,
	getLayerByIndex: getLayerByIndex,
	setActiveLayer: setActiveLayer,
	getLayerByPoint: getLayerByPoint,
	getCurrentDrawingBatch: getCurrentDrawingBatch,
	createDynamicBatch: createDynamicBatch,
	getAbsolutePixelAt: getAbsolutePixelAt,
	getRelativePixelAt: getRelativePixelAt,
	updateGlobalBoundings: updateGlobalBoundings,
	getBinaryShape: getBinaryShape,
	getCursorSize: getCursorSize
});

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
function fillBucket(x, y, color) {
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) { throw new Error("Invalid alpha color!"); }
  // differentiate between empty and colored tiles
  var layer = this.getCurrentLayer();
  var bounds = layer.bounds;
  var base = layer.getPixelAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) { return; }
  // save the current stack index
  var batch = layer.createBatchAt(x, y);
  // flood fill
  var shape = this.getBinaryShape(x, y, base);
  // ups, we filled infinite
  if (shape === null) { return; }
  // now fill a buffer by our grid data
  var bx = bounds.x + layer.x; var by = bounds.y + layer.y;
  var bw = bounds.w; var bh = bounds.h;
  var bcolor = [color[0], color[1], color[2], color[3]];
  batch.resizeRectangular(
    bx, by,
    bw, bh
  );
  var count = 0;
  // flood fill pixels
  for (var ii = 0; ii < bw * bh; ++ii) {
    var xx = (ii % bw) | 0;
    var yy = (ii / bw) | 0;
    var px = (yy * bw + xx) | 0;
    // only fill active grid pixels
    if (shape[px] !== 2) { continue; }
    batch.drawPixelFast(bx + xx, by + yy, bcolor);
    count++;
  }
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  // auto resize batch's size by the used pixel data
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.FILL, batch);
  // free grid from memory
  shape = null;
  return;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
function floodPaint(x, y) {
  var color = this.fillStyle;
  var layer = this.getCurrentLayer();
  var bounds = layer.bounds;
  var base = layer.getPixelAt(x, y);
  // empty base tile or colors to fill are the same
  if (base === null || colorsMatch(base, color)) { return; }
  var bx = bounds.x + layer.x; var by = bounds.y + layer.y;
  var bw = bounds.w; var bh = bounds.h;
  var batch = layer.createBatchAt(bx, by);
  batch.resizeRectangular(
    bx, by,
    bw, bh
  );
  var count = 0;
  // flood paint
  for (var ii = 0; ii < bw * bh; ++ii) {
    var xx = (ii % bw);
    var yy = (ii / bw) | 0;
    var pixel = layer.getPixelAt(bx + xx, by + yy);
    if (pixel === null) { continue; }
    if (!colorsMatch(base, pixel)) { continue; }
    batch.drawPixelFast(bx + xx, by + yy, color);
    count++;
  }
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.FLOOD_FILL, batch);
  return;
}


var _fill = Object.freeze({
	fillBucket: fillBucket,
	floodPaint: floodPaint
});

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
function insertImage(ctx, x, y) {
  var layer = this.getCurrentLayer();
  if (layer === null) { return; }
  var batch = layer.createBatchAt(x, y);
  var view = ctx.canvas;
  var width = view.width; var height = view.height;
  var data = ctx.getImageData(0, 0, width, height).data;
  var ww = width - 1; var hh = height - 1;
  batch.resizeRectangular(
    x, y,
    width - 1, height - 1
  );
  var count = 0;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = (ii / 4) | 0;
    var xx = (idx % width) | 0;
    var yy = (idx / width) | 0;
    var px = (yy * width + xx) * 4;
    var r = data[px + 0];
    var g = data[px + 1];
    var b = data[px + 2];
    var a = data[px + 3];
    if (a <= 0) { continue; }
    batch.drawPixelFast(x + xx, y + yy, [r, g, b, alphaByteToRgbAlpha(a)]);
    count++;
  }
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.refreshTexture(true);
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.INSERT_IMAGE, batch);
  return;
}

/**
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 */
function insertLine(x0, y0, x1, y1) {
  var this$1 = this;

  var base = 8 * this.cr;
  var batch = this.getCurrentDrawingBatch();
  var dx = Math.abs(x1 - x0); var dy = Math.abs(y1 - y0);
  var sx = (x0 < x1) ? 1 : -1; var sy = (y0 < y1) ? 1 : -1;
  var err = (dx - dy);
  while (true) {
    var relative = this$1.getRelativeTileOffset(x0, y0);
    // TODO: limit repeation rate on brush size (take modulo)
    if (this$1.states.drawing) {
      batch.drawAt(relative.x, relative.y, SETTINGS.PENCIL_SIZE, this$1.fillStyle);
    }
    else if (this$1.states.erasing) {
      batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
    }
    else if (this$1.states.lighting) {
      batch.applyColorLightness(relative.x, relative.y, SETTINGS.LIGHTING_MODE);
    }
    else if (this$1.states.stroke) {
      batch.drawAt(x0, y0, SETTINGS.PENCIL_SIZE, this$1.fillStyle);
    }
    if (x0 === x1 && y0 === y1) { break; }
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
function fillArc(batch, x, y, radius, color) {
  radius = (radius || 1.0) | 0;
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertStrokedArc(batch, x, y, radius, color);
  // TODO: now fill the stroked circle (with fill?)
}

/**
 * Inserts stroked arc at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
function strokeArc(batch, x, y, radius, color) {
  radius = (radius || 1.0) | 0;
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertStrokedArc(batch, x, y, radius, color);
}

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
function insertStrokedArc(batch, x1, y1, radius, color) {
  var x2 = radius;
  var y2 = 0;
  var err = 0;
  var size = SETTINGS.PENCIL_SIZE;
  for (;x2 >= y2;) {
    batch.drawAt(x2 + x1, y2 + y1, size, color);
    batch.drawAt(y2 + x1, x2 + y1, size, color);
    batch.drawAt(-x2 + x1, y2 + y1, size, color);
    batch.drawAt(-y2 + x1, x2 + y1, size, color);
    batch.drawAt(-x2 + x1, -y2 + y1, size, color);
    batch.drawAt(-y2 + x1, -x2 + y1, size, color);
    batch.drawAt(x2 + x1, -y2 + y1, size, color);
    batch.drawAt(y2 + x1, -x2 + y1, size, color);
    if (err <= 0) {
      y2 += 1;
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2 -= 1;
      err -= 2 * x2 + 1;
    }
  }
}

/**
 * Inserts filled rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
function fillRect$1(batch, x, y, width, height, color) {
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, true
  );
}

/**
 * Inserts stroked rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
function strokeRect(batch, x, y, width, height, color) {
  if (!color) { color = [255, 255, 255, 1]; }
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, false
  );
}

/**
 * Inserts rectangle at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Array} color
 * @param {Boolean} filled
 */
function insertRectangleAt(batch, x1, y1, x2, y2, color, filled) {
  var width = Math.abs(x2);
  var height = Math.abs(y2);
  var dx = (x2 < 0 ? -1 : 1);
  var dy = (y2 < 0 ? -1 : 1);
  var size = SETTINGS.PENCIL_SIZE;
  // stroke rectangle
  if (!filled) {
    for (var ii = 0; ii < width * height; ++ii) {
      var xx = (ii % width) | 0;
      var yy = (ii / width) | 0;
      if (!(
        (xx === 0 || xx >= width-1) ||
        (yy === 0 || yy >= height-1))
      ) { continue; }
      batch.drawAt(x1 + xx * dx, y1 + yy * dy, size, color);
    }
  // filled rectangle
  } else {
    for (var ii$1 = 0; ii$1 < width * height; ++ii$1) {
      var xx$1 = (ii$1 % width) | 0;
      var yy$1 = (ii$1 / width) | 0;
      batch.drawAt(x1 + xx$1 * dx, y1 + yy$1 * dy, size, color);
    }
  }
}


var _insert = Object.freeze({
	insertImage: insertImage,
	insertLine: insertLine,
	fillArc: fillArc,
	strokeArc: strokeArc,
	insertStrokedArc: insertStrokedArc,
	fillRect: fillRect$1,
	strokeRect: strokeRect,
	insertRectangleAt: insertRectangleAt
});

/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {Uint8Array} data
 * @param {Number} width
 * @param {Number} height
 * @return {WebGLTexture}
 */
function bufferTexture(name, data, width, height) {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (this.cache.gl.textures[name] === void 0) {
    this.cache.gl.textures[name] = texture;
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  return (this.cache.gl.textures[name]);
}

/**
 * Lookup for the texture inside our texture pool and free it from memory
 * @param {WebGLTexture} texture
 */
function destroyTexture(texture) {
  var gl = this.gl;
  var textures = this.cache.gl.textures;
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
 * @param {Uint8Array} data
 * @param {Number} width
 * @param {Number} height
 */
function updateTexture(texture, data, width, height) {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLTexture}
 */
function bufferTextureByCanvas(name, canvas) {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (this.cache.gl.textures[name] === void 0) {
    this.cache.gl.textures[name] = texture;
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  return (this.cache.gl.textures[name]);
}

/**
 * @param {WebGLTexture} texture
 * @param {HTMLCanvasElement} canvas
 */
function updateTextureByCanvas(texture, canvas) {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var _buffer = Object.freeze({
	bufferTexture: bufferTexture,
	destroyTexture: destroyTexture,
	updateTexture: updateTexture,
	bufferTextureByCanvas: bufferTextureByCanvas,
	updateTextureByCanvas: updateTextureByCanvas
});

var SPRITE_VERTEX = "\n  precision lowp float;\n  uniform vec2 uScale;\n  uniform vec2 uObjScale;\n  attribute vec2 aObjCen;\n  attribute float aIdx;\n  varying vec2 uv;\n  void main(void) {\n    if (aIdx == 0.0) {\n      uv = vec2(0.0,0.0);\n    } else if (aIdx == 1.0) {\n      uv = vec2(1.0,0.0);\n    } else if (aIdx == 2.0) {\n      uv = vec2(0.0,1.0);\n    } else {\n      uv = vec2(1.0,1.0);\n    }\n    gl_Position = vec4(\n      -1.0 + 2.0 * (aObjCen.x + uObjScale.x * (-0.5 + uv.x)) / uScale.x,\n      1.0 - 2.0 * (aObjCen.y + uObjScale.y * (-0.5 + uv.y)) / uScale.y,\n      0.0, 1.0\n    );\n  }\n";

var SPRITE_FRAGMENT = "\n  precision lowp float;\n  uniform sampler2D uSampler;\n  varying vec2 uv;\n  uniform int isRect;\n  uniform vec4 vColor;\n  void main(void) {\n    if (isRect == 0) {\n      gl_FragColor = texture2D(uSampler, uv);\n    } else {\n      gl_FragColor = vColor + texture2D(uSampler, uv);\n    }\n    if (gl_FragColor.a < 0.1) discard;\n  }\n";


var _shaders = Object.freeze({
	SPRITE_VERTEX: SPRITE_VERTEX,
	SPRITE_FRAGMENT: SPRITE_FRAGMENT
});

/**
 * @param {HTMLCanvasElement} view 
 */
function setupRenderer(view) {
  this.view = view;
  this.gl = getWGLContext(view);
  this.program = this.createSpriteProgram();
  this.gl.useProgram(this.program);
  this.cache.gl.empty = this.createEmptyTexture();
}

/**
 * @return {WebGLTexture}
 */
function createEmptyTexture() {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0])
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
  return (texture);
}

/**
 * @return {WebGLProgram}
 */
function createSpriteProgram() {
  var gl = this.gl;
  var size = WGL_TEXTURE_LIMIT;
  var program = gl.createProgram();
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);

  this.compileShader(vshader, SPRITE_VERTEX);
  this.compileShader(fshader, SPRITE_FRAGMENT);

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);

  var cache = this.cache.gl;
  var buffers = cache.buffers;
  var vertices = cache.vertices;
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

  this.setGlAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return (program);
}

function compileShader(shader, shader_src) {
  var gl = this.gl;
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
}

function setGlAttribute(program, buffer, name, size, values) {
  var gl = this.gl;
  var attribute = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);
  }
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
}


var _build = Object.freeze({
	setupRenderer: setupRenderer,
	createEmptyTexture: createEmptyTexture,
	createSpriteProgram: createSpriteProgram,
	compileShader: compileShader,
	setGlAttribute: setGlAttribute
});

/**
 * Clears the context
 */
function clear$1() {
  var gl = this.gl;
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * Draw a texture
 * @param {Texture} tex
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
function drawImage(tex, dx, dy, dw, dh) {
  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  var gl = this.gl;
  var program = this.program;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );

  var pos = this.cache.gl.vertices.position;
  for (var ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  this.setGlAttribute(program, this.cache.gl.buffers.position, "aObjCen", 2, pos);
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

  var gl = this.gl;
  var program = this.program;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 1);

  var pos = this.cache.gl.vertices.position;
  for (var ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.cache.gl.empty);
  gl.uniform4f(
    gl.getUniformLocation(program, "vColor"),
    color[0], color[1], color[2], color[3]
  );
  this.setGlAttribute(program, this.cache.gl.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 0);

}


var _draw = Object.freeze({
	clear: clear$1,
	drawImage: drawImage,
	drawRectangle: drawRectangle
});

/**
 * @return {CanvasRenderingContext2D}
 */
function createGridBuffer() {
  var cw = this.cw;
  var ch = this.ch;
  var buffer = createCanvasBuffer(cw, ch);
  if (this.cache.grid !== null) {
    this.cache.grid = null;
    this.destroyTexture(this.cache.gridTexture);
  }
  this.cache.grid = buffer;
  this.cache.gridTexture = this.bufferTextureByCanvas("grid", buffer.canvas);
  this.redrawGridBuffer();
  return (buffer);
}

/**
 * TODO: use imagedata and draw the grid onto
 * @return {Void}
 */
function redrawGridBuffer() {
  if (this.cr <= HIDE_GRID) { return; }
  var buffer = this.cache.grid;
  var texture = this.cache.gridTexture;
  var cr = this.cr;
  var size = (TILE_SIZE * cr) | 0;
  var cx = this.cx;
  var cy = this.cy;
  var cw = this.cw;
  var ch = this.ch;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (var xx = (cx % size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  }
  for (var yy = (cy % size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  }
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.updateTextureByCanvas(texture, buffer.canvas);
  this.last.cx = this.cx;
  this.last.cy = this.cy;
  return;
}

/**
 * @return {WebGLTexture}
 */
function createBackgroundBuffer() {
  if (this.cache.bg instanceof WebGLTexture) {
    this.destroyTexture(this.cache.bg);
  }
  var size = TILE_SIZE;
  var cw = this.cw;
  var ch = this.ch;
  var canvas = document.createElement("canvas");
  var buffer = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  buffer.fillStyle = "#1f1f1f";
  buffer.fillRect(0, 0, cw, ch);
  // bright rectangles
  buffer.fillStyle = "#212121";
  for (var yy = 0; yy < ch; yy += size*2) {
    for (var xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      buffer.fillRect(xx, yy, size, size);
      buffer.fillRect(xx, yy, size, size);
    }
  }
  for (var yy$1 = size; yy$1 < ch; yy$1 += size*2) {
    for (var xx$1 = size; xx$1 < cw; xx$1 += size*2) {
      buffer.fillRect(xx$1, yy$1, size, size);
    }
  }
  var texture = this.bufferTextureByCanvas("background", canvas);
  return (texture);
}

/**
 * @return {CanvasRenderingContext2D}
 */
function createForegroundBuffer() {
  var cw = this.cw;
  var ch = this.ch;
  var buffer = createCanvasBuffer(cw, ch);
  applyImageSmoothing(buffer, true);
  if (this.cache.fg !== null) {
    this.cache.fg = null;
    this.destroyTexture(this.cache.fgTexture);
  }
  this.cache.fg = buffer;
  this.cache.fgTexture = this.bufferTextureByCanvas("foreground", buffer.canvas);
  return (buffer);
}


var _generate = Object.freeze({
	createGridBuffer: createGridBuffer,
	redrawGridBuffer: redrawGridBuffer,
	createBackgroundBuffer: createBackgroundBuffer,
	createForegroundBuffer: createForegroundBuffer
});

/**
 * @return {String}
 */
function exportAsDataUrl() {
  if (!(this.main.buffer instanceof CanvasRenderingContext2D)) { return (""); }
  var buffer = this.main.buffer;
  var view = buffer.canvas;
  return (view.toDataURL("image/png"));
}


var _main = Object.freeze({
	exportAsDataUrl: exportAsDataUrl
});

function updateGrid() {
  // only redraw texture if it's absolutely necessary
  if (this.last.cx !== this.cx || this.last.cy !== this.cy) {
    this.redrawGridBuffer();
    this.redraw = true;
  }
}

/** Main render method */
function render() {
  var this$1 = this;

  var selection = this.sw !== -0 && this.sh !== -0;
  var cr = this.cr;
  this.renderBackground();
  if (this.cr > HIDE_GRID) { this.renderGrid(); }
  // render cached version of our working area
  var cx = this.cx | 0;
  var cy = this.cy | 0;
  // draw global boundings
  if (MODES.DEV) {
    var bounds = this.bounds;
    var x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
    var y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
    var w = (bounds.w * TILE_SIZE) * cr;
    var h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [0, 1, 0, 0.1]
    );
  }
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var idx = layers.length - 1 - ii;
    var layer = layers[idx];
    if (!layer.visible) { continue; }
    var bounds$1 = layer.bounds;
    var ww = (bounds$1.w * TILE_SIZE) * cr;
    var hh = (bounds$1.h * TILE_SIZE) * cr;
    var xx = cx + ((layer.x + bounds$1.x) * TILE_SIZE) * cr;
    var yy = cy + ((layer.y + bounds$1.y) * TILE_SIZE) * cr;
    this$1.drawImage(
      layer.batch.texture,
      xx, yy,
      ww, hh
    );
    // don't forget to render live batches
    this$1.renderLayer(layer);
  }
  // render live data
  //this.renderLayers();
  if (!this.states.drawing && (!this.states.select || !selection)) {
    this.renderHoveredTile();
  }
  if (this.shape !== null) { this.renderShapeSelection(); }
  else if (selection) { this.renderSelection(); }
  if (MODES.DEV) { this.renderStats(); }
  this.redraw = false;
}

function renderBackground() {
  this.drawImage(
    this.cache.bg,
    0, 0,
    this.cw, this.ch
  );
}

function renderGrid() {
  this.drawImage(
    this.cache.gridTexture,
    0, 0,
    this.cw, this.ch
  );
}

/**
 * @param {Layer} layer
 */
function renderLayer(layer) {
  var this$1 = this;

  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  var batches = layer.batches;
  var sindex = this.sindex;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    var bounds = batch.bounds;
    if (!batch.forceRendering) { continue; }
    // batch index is higher than stack index, so ignore this batch
    if (sindex - batch.getStackIndex() < 0) {
      if (!batch.forceRendering) { continue; }
    }
    //if (!this.boundsInsideView(bounds)) continue;
    var x = (cx + (((layer.x + bounds.x) * TILE_SIZE) * cr)) | 0;
    var y = (cy + (((layer.y + bounds.y) * TILE_SIZE) * cr)) | 0;
    var w = (bounds.w * TILE_SIZE) * cr;
    var h = (bounds.h * TILE_SIZE) * cr;
    // draw batch boundings
    if (MODES.DEV) {
      this$1.drawRectangle(
        x, y,
        w, h,
        [1, 0, 0, 0.1]
      );
    }
    // erase by alpha blending
    if (batch.isEraser) {
      var gl = this$1.gl;
      gl.blendFuncSeparate(gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ZERO);
    }
    this$1.drawImage(
      batch.texture,
      x, y,
      w, h
    );
    // reset blending state
    if (batch.isEraser) {
      var gl$1 = this$1.gl;
      gl$1.blendFunc(gl$1.SRC_ALPHA, gl$1.ONE_MINUS_SRC_ALPHA);
    }
  }
}

function renderHoveredTile() {
  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  // apply empty tile hover color
  var mx = this.mx;
  var my = this.my;
  var relative = this.getRelativeTileOffset(mx, my);
  var rx = relative.x * TILE_SIZE;
  var ry = relative.y * TILE_SIZE;
  var x = ((cx + GRID_LINE_WIDTH/2) + (rx * cr)) | 0;
  var y = ((cy + GRID_LINE_WIDTH/2) + (ry * cr)) | 0;
  var ww = (TILE_SIZE * cr) | 0;
  var hh = (TILE_SIZE * cr) | 0;
  this.drawRectangle(
    x, y,
    ww, hh,
    TILE_HOVER_COLOR
  );
}

function renderSelection() {
  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  var xx = (cx + (this.sx * TILE_SIZE) * cr) | 0;
  var yy = (cy + (this.sy * TILE_SIZE) * cr) | 0;
  var ww = ((this.sw * TILE_SIZE) * cr) | 0;
  var hh = ((this.sh * TILE_SIZE) * cr) | 0;
  var color = (
    this.states.selecting ?
    SELECTION_COLOR_ACTIVE :
    SELECTION_COLOR
  );
  this.drawRectangle(
    xx, yy,
    ww, hh,
    color
  );
}

function renderShapeSelection() {
  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  var batch = this.shape;
  var bounds = batch.bounds;
  var xx = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
  var yy = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
  var ww = (bounds.w * TILE_SIZE) * cr;
  var hh = (bounds.h * TILE_SIZE) * cr;
  this.drawImage(
    batch.texture,
    xx, yy, ww, hh
  );
}

function renderStats() {
  var buffer = this.cache.fg;
  var bounds = this.bounds;
  var view = buffer.canvas;
  var texture = this.cache.fgTexture;
  var mx = this.last.mx;
  var my = this.last.my;
  // clear
  buffer.clearRect(0, 0, this.cw, this.ch);
  // font style
  buffer.font = "10px Verdana";
  buffer.fillStyle = "#fff";
  // stats
  buffer.fillText(("Mouse: x: " + mx + ", y: " + my), 8, 16);
  buffer.fillText(("GPU textures: " + (Object.keys(this.cache.gl.textures).length)), 8, 28);
  buffer.fillText(("Boundings: x: " + (bounds.x) + ", y: " + (bounds.y) + ", w: " + (bounds.w) + ", h: " + (bounds.h)), 8, 40);
  buffer.fillText(("Camera scale: " + (this.cr)), 8, 52);
  buffer.fillText(("Stack: " + (this.sindex + 1) + ":" + (this.stack.length)), 8, 64);
  // mouse color
  var color = this.getAbsolutePixelAt(mx, my);
  if (color !== null) {
    buffer.fillStyle = colorToRgbaString(color);
    buffer.fillRect(8, 70, 8, 8);
    buffer.fillStyle = "#fff";
    buffer.fillText(((color[0]) + ", " + (color[1]) + ", " + (color[2]) + ", " + (color[3])), 22, 77);
  }
  /*if (MODES.DEV) {
    const bounds = this.bounds;
    const cr = this.cr;
    const xx = ((this.cx | 0) + ((bounds.x * TILE_SIZE) * cr)) | 0;
    const yy = ((this.cy | 0) + ((bounds.y * TILE_SIZE) * cr)) | 0;
    const ww = (bounds.w * TILE_SIZE) * cr;
    const hh = (bounds.h * TILE_SIZE) * cr;
    this.drawResizeRectangle(xx, yy, ww, hh, "#313131");
  }*/
  if (this.sw !== 0 && this.sh !== 0) {
    this.drawSelectionShape();
  }
  // update texture, then draw it
  this.updateTextureByCanvas(texture, view);
  this.drawImage(
    texture,
    0, 0, view.width, view.height
  );
}

function drawSelectionShape() {
  var cr = this.cr;
  var s = this.getSelection();
  var xx = ((this.cx | 0) + ((s.x * TILE_SIZE) * cr)) | 0;
  var yy = ((this.cy | 0) + ((s.y * TILE_SIZE) * cr)) | 0;
  var ww = (s.w * TILE_SIZE) * cr;
  var hh = (s.h * TILE_SIZE) * cr;
  var size = TILE_SIZE * cr;
  var buffer = this.cache.fg;
  buffer.strokeStyle = "rgba(255,255,255,0.7)";
  buffer.lineWidth = 0.45 * cr;
  buffer.setLineDash([size, size]);
  buffer.strokeRect(
    xx, yy,
    ww, hh
  );
}

/**
 * Draw resizable rectangle around given rectangle corners
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {String} color
 */
function drawResizeRectangle(x, y, w, h, color) {
  var cr = this.cr;
  var ww = 4 * cr;
  var hh = 4 * cr;
  var buffer = this.cache.fg;
  buffer.strokeStyle = color;
  buffer.lineWidth = Math.max(0.4, 0.45 * cr);
  // main rectangle
  buffer.strokeRect(
    x, y,
    w, h
  );
  return;
  buffer.lineWidth = Math.max(0.4, 0.3 * cr);
  // left rectangle
  buffer.strokeRect(
    x - ww, (y + (h / 2) - hh / 2),
    ww, hh
  );
  // right rectangle
  buffer.strokeRect(
    x + w, (y + (h / 2) - hh / 2),
    ww, hh
  );
  // top rectangle
  buffer.strokeRect(
    (x + (w / 2) - ww / 2), y - hh,
    ww, hh
  );
  // bottom rectangle
  buffer.strokeRect(
    (x + (w / 2) - ww / 2), (y + h),
    ww, hh
  );
}


var _render = Object.freeze({
	updateGrid: updateGrid,
	render: render,
	renderBackground: renderBackground,
	renderGrid: renderGrid,
	renderLayer: renderLayer,
	renderHoveredTile: renderHoveredTile,
	renderSelection: renderSelection,
	renderShapeSelection: renderShapeSelection,
	renderStats: renderStats,
	drawSelectionShape: drawSelectionShape,
	drawResizeRectangle: drawResizeRectangle
});

/**
 * Resize
 * @param {Number} width
 * @param {Number} height
 */
function resize(width, height) {
  width = width | 0;
  height = height | 0;
  var gl = this.gl;
  var view = this.view;
  // first update camera size
  this.cw = width;
  this.ch = height;
  // update view
  view.width = width;
  view.height = height;
  // update viewport
  gl.viewport(0, 0, width, height);
  // update shader scales
  gl.uniform2f(
    gl.getUniformLocation(this.program, "uScale"),
    width, height
  );
  gl.enable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // re-generate our bg and fg
  this.cache.bg = this.createBackgroundBuffer();
  this.cache.fg = this.createForegroundBuffer();
  // re-generate our grid
  this.cache.grid = this.createGridBuffer();
  this.redrawGridBuffer();
  this.redraw = true;
}


var _resize = Object.freeze({
	resize: resize
});

/**
 * @class Command
 */
var Command = function Command(kind, batch) {
  this.kind = kind;
  this.batch = batch;
};

/**
 * @return {Void}
 */
function redo$1() {
  // prevent undo/redo when in e.g drawing state
  if (this.isInActiveState()) { return; }
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    var cmd = this.currentStackOperation();
    this.fire(cmd, true);
  }
  this.updateGlobalBoundings();
  this.redraw = true;
  return;
}

/**
 * @param {Number} kind
 * @param {Batch} batch
 */
function enqueue(kind, batch) {
  // our stack index is out of position
  // => clean up all more recent batches
  this.refreshStack();
  var cmd = new Command(kind, batch);
  this.stack.push(cmd);
  this.redo();
  //this.undo();
  //this.redo();
}


var _redo = Object.freeze({
	redo: redo$1,
	enqueue: enqueue
});

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
  //this.updateGlobalBoundings();
}

/**
 * Returns the latest stack operation
 * @return {Object}
 */
function currentStackOperation() {
  return (this.stack[this.sindex]);
}

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
function fire(cmd, state) {
  var kind = this.getCommandKind(cmd);
  switch (kind) {
    case CommandKind.LAYER_OPERATION:
      this.fireLayerOperation(cmd, state);
    break;
    case CommandKind.BATCH_OPERATION:
      this.fireBatchOperation(cmd, state);
    break;
  }
}

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
function fireLayerOperation(cmd, state) {
  var kind = cmd.kind;
  var batch = cmd.batch;
  var layer = batch.layer;
  var main = layer.batch;
  switch (kind) {
    case CommandKind.LAYER_CLONE:
      layer.updateBoundings();
      if (state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        var index = batch.index < 0 ? 0 : batch.index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
      main.injectMatrix(layer.batch, state);
      main.refreshTexture(true);
    break;
    case CommandKind.LAYER_ADD:
      if (state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        var index$1 = batch.index < 0 ? 0 : batch.index;
        this.setActiveLayer(this.getLayerByIndex(index$1));
      }
    break;
    case CommandKind.LAYER_REMOVE:
      if (!state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        var index$2 = batch.index < 0 ? 0 : batch.index;
        index$2 = index$2 === this.layers.length ? index$2 - 1 : index$2;
        this.setActiveLayer(this.getLayerByIndex(index$2));
      }
    break;
    case CommandKind.LAYER_RENAME:
      layer.name = batch[state ? "name": "oname"];
    break;
    case CommandKind.LAYER_LOCK:
      layer.locked = !layer.locked;
    break;
    case CommandKind.LAYER_VISIBILITY:
      layer.visible = !layer.visible;
    break;
    case CommandKind.LAYER_ORDER:
      if (state) {
        var tmp = this.layers[batch.oindex];
        this.layers[batch.oindex] = this.layers[batch.index];
        this.layers[batch.index] = tmp;
        tmp.removeUiReference(); tmp.addUiReference();
        this.setActiveLayer(tmp);
      } else {
        var tmp$1 = this.layers[batch.index];
        this.layers[batch.index] = this.layers[batch.oindex];
        this.layers[batch.oindex] = tmp$1;
        tmp$1.removeUiReference(); tmp$1.addUiReference();
        this.setActiveLayer(tmp$1);
      }
    break;
    case CommandKind.LAYER_MOVE:
      layer.updateBoundings();
      var dir = state ? 1 : -1;
      layer.x += (batch.position.x * dir);
      layer.y += (batch.position.y * dir);
    break;
    case CommandKind.LAYER_FLIP_VERTICAL:
    break;
    case CommandKind.LAYER_FLIP_HORIZONTAL:
    break;
    case CommandKind.LAYER_MERGE:
      batch.merge.mergeWithLayer(layer, state);
    break;
  }
}

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
function fireBatchOperation(cmd, state) {
  var batch = cmd.batch;
  var layer = batch.layer;
  var main = layer.batch;
  var kind = cmd.kind;
  layer.updateBoundings();
  main.injectMatrix(batch, state);
  main.refreshTexture(true);
}

/**
 * @param {Command} cmd
 * @return {Number}
 */
function getCommandKind(cmd) {
  var kind = cmd.kind;
  switch (kind) {
    case CommandKind.LAYER_LOCK:
    case CommandKind.LAYER_MOVE:
    case CommandKind.LAYER_ORDER:
    case CommandKind.LAYER_RENAME:
    case CommandKind.LAYER_ROTATE:
    case CommandKind.LAYER_VISIBILITY:
    case CommandKind.LAYER_ADD:
    case CommandKind.LAYER_REMOVE:
    case CommandKind.LAYER_CLONE:
    case CommandKind.LAYER_MERGE:
    case CommandKind.LAYER_FLIP_VERTICAL:
    case CommandKind.LAYER_FLIP_HORIZONTAL:
      return (CommandKind.LAYER_OPERATION);
    break;
    case CommandKind.DRAW:
    case CommandKind.ERASE:
    case CommandKind.FILL:
    case CommandKind.BACKGROUND:
    case CommandKind.PASTE:
    case CommandKind.CUT:
    case CommandKind.INSERT_IMAGE:
    case CommandKind.STROKE:
    case CommandKind.RECT_FILL:
    case CommandKind.RECT_STROKE:
    case CommandKind.ARC_FILL:
    case CommandKind.ARC_STROKE:
    case CommandKind.FLOOD_FILL:
    case CommandKind.LIGHTING:
      return (CommandKind.BATCH_OPERATION);
    break;
  }
  return (CommandKind.UNKNOWN);
}


var _state = Object.freeze({
	refreshStack: refreshStack,
	currentStackOperation: currentStackOperation,
	fire: fire,
	fireLayerOperation: fireLayerOperation,
	fireBatchOperation: fireBatchOperation,
	getCommandKind: getCommandKind
});

/**
 * @return {Void}
 */
function undo$1() {
  // prevent undo/redo when in e.g drawing state
  if (this.isInActiveState()) { return; }
  if (this.sindex >= 0) {
    var cmd = this.currentStackOperation();
    this.fire(cmd, false);
    this.sindex--;
  }
  this.updateGlobalBoundings();
  this.redraw = true;
  return;
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
  for (var ii = count; ii > 0; --ii) {
    var idx = from + ii - 1;
    var cmd = this$1.stack[idx];
    var kind = this$1.getCommandKind(cmd);
    switch (kind) {
      case CommandKind.BATCH_OPERATION:
        cmd.batch.kill();
      break;
    }
    this$1.stack.splice(idx, 1);
  }
}


var _undo = Object.freeze({
	undo: undo$1,
	dequeue: dequeue
});

/**
 * @param {String} key 
 * @return {String}
 */
function readStorage(key) {
  var access = STORAGE_KEY + "::" + key;
  var value = STORAGE_OBJECT.getItem(access);
  return (value || "");
}


var _read = Object.freeze({
	readStorage: readStorage
});

/**
 * @param {String} key 
 * @param {String} value 
 */
function writeStorage(key, value) {
  var access = STORAGE_KEY + "::" + key;
  STORAGE_OBJECT.setItem(access, value);
}

/**
 * @param {String} key 
 * @param {String} value 
 */
function appendStorage(key, value) {
  var access = STORAGE_KEY + "::" + key;
  var base = this.readStorage(key);
  this.writeStorage(key, base + value);
}


var _write = Object.freeze({
	writeStorage: writeStorage,
	appendStorage: appendStorage
});

/**
 * @param {Batch} base
 * @param {Boolean} vertical
 */
function flip(base, vertical) {
  var x = base.bounds.x;
  var y = base.bounds.y;
  var ww = base.bounds.w;
  var hh = base.bounds.h;
  base.data = base.data.reverse();
}


var _transflip = Object.freeze({
	flip: flip
});

/**
 * Rotate in 90° steps
 * @param {Number} value
 */
function rotate(value) {
  value = value ? 90 : -90;
}


var _transrotate = Object.freeze({
	rotate: rotate
});

function resetModes() {
  var this$1 = this;

  for (var key in this.modes) {
    this$1.resetSelection();
    this$1.modes[key] = false;
  }
  this.resetActiveUiButtons();
}

function resetActiveUiButtons() {
  arc.style.removeProperty("opacity");
  move.style.removeProperty("opacity");
  shape.style.removeProperty("opacity");
  tiled.style.removeProperty("opacity");
  erase.style.removeProperty("opacity");
  bucket.style.removeProperty("opacity");
  select.style.removeProperty("opacity");
  stroke.style.removeProperty("opacity");
  pipette.style.removeProperty("opacity");
  lighting.style.removeProperty("opacity");
  rectangle.style.removeProperty("opacity");
  paint_all.style.removeProperty("opacity");
}

/**
 * @return {Void}
 */
function setUiColor(value) {
  // close fast color picker menu
  if (this.states.fastColorMenu) {
    this.closeFastColorPickerMenu();
  }
  color_hex.innerHTML = String(value).toUpperCase();
  color_view.style.background = value;
  var rgba = hexToRgba(value);
  // prevent changing color if it didnt changed
  if (
    this.fillStyle[0] === rgba[0] &&
    this.fillStyle[1] === rgba[1] &&
    this.fillStyle[2] === rgba[2] &&
    this.fillStyle[3] === rgba[3]
  ) { return; }
  this.fillStyle = rgba;
  this.addCustomColor(rgba);
  return;
}

/**
 * @param {Array} rgba
 */
function addCustomColor(rgba) {
  var colors = this.favoriteColors;
  var count = 0;
  for (var ii = 0; ii < colors.length; ++ii) {
    var color$1 = colors[ii].color;
    var index = colors[ii].index;
    // color already saved, increase it's importance
    if (
      color$1[0] === rgba[0] &&
      color$1[1] === rgba[1] &&
      color$1[2] === rgba[2] &&
      color$1[3] === rgba[3]
    ) {
      colors[ii].index += 1;
      count++;
      //console.log("Found!", color, rgba);
    }
  }
  // color isn't saved yet
  if (count <= 0) {
    // color limit exceeded, replace less used color with this one
    if (colors.length >= 16) {
      colors[colors.length - 1].color = color;
      colors[colors.length - 1].index += 1;
    } else {
      // we have to replace the less used color
      colors.push({
        color: rgba,
        index: 0
      });
    }
  }
  // resort descending by most used color
  colors.sort(function (a, b) { return (b.index - a.index); });
  // sync with storage
  this.writeStorage("favorite_colors", JSON.stringify(colors));
  // sync color menu with favorite colors
  this.updateFastColorPickMenu();
}

function closeFastColorPickerMenu() {
  menu.style.visibility = "hidden";
  this.states.fastColorMenu = false;
}

function openFastColorPickerMenu() {
  menu.style.visibility = "visible";
  this.states.fastColorMenu = true;
}

function updateFastColorPickMenu() {
  var this$1 = this;

  // first remove all color nodes
  for (var ii = 0; ii < 16; ++ii) {
    var node = colors.children[0];
    if (!node) { continue; }
    node.parentNode.removeChild(node);
  }
  // now re-insert the updated ones
  for (var ii$1 = 0; ii$1 < 16; ++ii$1) {
    var color = this$1.favoriteColors[ii$1];
    var node$1 = document.createElement("div");
    if (color) {
      node$1.setAttribute("color", "[" + color.color + "]");
      node$1.style.background = rgbaToHex(color.color);
    } else {
      node$1.setAttribute("color", "[0,0,0,1]");
      node$1.style.background = "#000000";
    }
    colors.appendChild(node$1);
  }
}

/**
 * @param {HTMLElement} e
 * @param {Boolean} dbl
 */
function clickedLayer(e, dbl) {
  var this$1 = this;

  var el = e.target;
  var kind = el.classList.value;
  var parent = (
    kind !== "layer-item" ? el.parentNode : el
  );
  var layer = this.getLayerByNode(parent);
  if (layer === null) { return; }
  switch (kind) {
    // clicked on layer, set it active
    case "layer-text":
      if (!dbl) {
        this.setActiveLayer(layer);
      }
      else {
        el.removeAttribute("readonly");
        el.focus();
        el.onkeypress = function (e) {
          var code = (e.keyCode ? e.keyCode : e.which);
          if (code === 13) { el.blur(); }
        };
        el.onblur = function () {
          var oname = layer.name;
          if (!el.value) {
            layer.name = oname;
          } else {
            if (String(oname) !== el.value) {
              this$1.enqueue(CommandKind.LAYER_RENAME, {
                oname: oname, name: el.value, layer: layer
              });
            }
          }
          el.setAttribute("readonly", "readonly");
        };
      }
    break;
    // clicked a layer icon
    case "layer-item-visible":
      this.enqueue(CommandKind.LAYER_VISIBILITY, {
        layer: layer
      });
    break;
    // clicked lock icon
    case "layer-item-locked":
      this.enqueue(CommandKind.LAYER_LOCK, {
        layer: layer
      });
    break;
  }
}

function setupUi() {
  var this$1 = this;


  // ui
  tiled.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.draw = true;
    tiled.style.opacity = 1.0;
  };
  erase.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.erase = true;
    erase.style.opacity = 1.0;
  };
  bucket.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.fill = true;
    bucket.style.opacity = 1.0;
  };
  pipette.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.pipette = true;
    pipette.style.opacity = 1.0;
  };
  select.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.select = true;
    select.style.opacity = 1.0;
  };
  stroke.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.stroke = true;
    stroke.style.opacity = 1.0;
  };
  arc.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.arc = true;
    arc.style.opacity = 1.0;
  };
  rectangle.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.rect = true;
    rectangle.style.opacity = 1.0;
  };
  paint_all.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.flood = true;
    paint_all.style.opacity = 1.0;
  };
  shape.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.shape = true;
    shape.style.opacity = 1.0;
  };
  lighting.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.light = true;
    lighting.style.opacity = 1.0;
  };
  move.onclick = function (e) {
    this$1.resetModes();
    this$1.modes.move = true;
    move.style.opacity = 1.0;
  };
  color.onchange = function (e) {
    this$1.setUiColor(color.value);
  };

  undo.onclick = function (e) {
    this$1.undo();
  };
  redo.onclick = function (e) {
    this$1.redo();
  };

  download.onclick = function (e) {
    var link = document.createElement("a");
    var data = this$1.exportAsDataUrl();
    link.href = data;
    link.download = 655321 + ".png";
    link.click();
  };

  // ## drag&drop images
  file.onclick = function (e) { e.preventDefault(); };
  file.onchange = function (e) {
    file.style.display = "none";
    var reader = new FileReader();
    reader.onload = function (e) {
      if (e.target.result.slice(11, 14) !== "png") {
        throw new Error("Invalid image type!");
      }
      var img = new Image();
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(
          img,
          0, 0,
          img.width, img.height,
          0, 0,
          img.width, img.height
        );
        this$1.insertImage(ctx, this$1.last.mx, this$1.last.my);
        file.value = ""; // reassign to allow second files
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  // hidy things for drag & drop input
  this.view.addEventListener("dragenter", function (e) {
    file.style.display = "block";
  });
  file.addEventListener("dragleave", function (e) {
    file.style.display = "none";
  });

  layers.addEventListener("click", function (e) { return this$1.clickedLayer(e, false); });
  layers.addEventListener("dblclick", function (e) { return this$1.clickedLayer(e, true); });

  add_layer.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    var index = layer ? layer.getIndex() : 0;
    index = index < 0 ? 0 : index;
    this$1.enqueue(CommandKind.LAYER_ADD, {
      layer: new Layer(this$1), index: index
    });
  };
  remove_layer.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    var index = layer ? layer.getIndex() : 0;
    index = index < 0 ? 0 : index;
    if (layer !== null) { this$1.enqueue(CommandKind.LAYER_REMOVE, {
      layer: layer, index: index
    }); }
    this$1.redraw = true;
  };

  move_layer_up.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null && layer.getIndex() > 0) {
      this$1.enqueue(CommandKind.LAYER_ORDER, {
        layer: layer, index: layer.getIndex() - 1, oindex: layer.getIndex()
      });
    }
    this$1.redraw = true;
  };
  move_layer_down.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null && layer.getIndex() < this$1.layers.length - 1) {
      this$1.enqueue(CommandKind.LAYER_ORDER, {
        layer: layer, index: layer.getIndex() + 1, oindex: layer.getIndex()
      });
    }
    this$1.redraw = true;
  };

  clone.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null) {
      var index = layer ? layer.getIndex() : 0;
      index = index < 0 ? 0 : index;
      this$1.enqueue(CommandKind.LAYER_CLONE, {
        layer: layer.clone(), index: index
      });
    }
  };

  flip_horizontal.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null) {
      var data = new Uint8Array(layer.batch.data);
      this$1.enqueue(CommandKind.LAYER_FLIP_HORIZONTAL, { layer: layer, data: data });
    }
  };
  flip_vertical.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null) {
      var data = new Uint8Array(layer.batch.data);
      this$1.enqueue(CommandKind.LAYER_FLIP_VERTICAL, { layer: layer, data: data });
    }
  };

  merge.onclick = function (e) {
    var layer = this$1.getCurrentLayer();
    if (layer !== null && this$1.layers.length > 1) {
      if (layer.getIndex() < this$1.layers.length - 1) {
        var merge = this$1.getLayerByIndex(layer.getIndex() + 1);
        this$1.enqueue(CommandKind.LAYER_MERGE, { layer: layer, merge: merge });
      }
    }
  };

  this.modes.draw = true;
  tiled.style.opacity = 1.0;

  // setup ui list button states
  this.processUIClick(document.querySelector("#light-size").children[0]);
  this.processUIClick(document.querySelector("#eraser-size").children[0]);
  this.processUIClick(document.querySelector("#pencil-size").children[0]);

}


var _ui = Object.freeze({
	resetModes: resetModes,
	resetActiveUiButtons: resetActiveUiButtons,
	setUiColor: setUiColor,
	addCustomColor: addCustomColor,
	closeFastColorPickerMenu: closeFastColorPickerMenu,
	openFastColorPickerMenu: openFastColorPickerMenu,
	updateFastColorPickMenu: updateFastColorPickMenu,
	clickedLayer: clickedLayer,
	setupUi: setupUi
});

function setup() {
  var this$1 = this;

  var view = document.createElement("canvas");
  var width = window.innerWidth;
  var height = window.innerHeight;
  view.width = width;
  view.height = height;
  // sync storage colors with stage colors
  var colors = this.readStorage("favorite_colors");
  if (colors && colors.length > 2) {
    this.favoriteColors = JSON.parse(colors);
    this.updateFastColorPickMenu();
    this.setUiColor(rgbaToHex(this.favoriteColors[0].color));
  } else {
    this.setUiColor(rgbaToHex([255, 0, 0, 1]));
  }
  this.setupRenderer(view);
  this.initListeners();
  this.resize(width, height);
  this.scale(0);
  var draw = function () {
    requestAnimationFrame(function () { return draw(); });
    if (this$1.redraw) {
      this$1.clear();
      this$1.render();
    }
  };
  // add some things manually
  (function () {
    this$1.cache.layer = new Layer(this$1);
    var layer = this$1.addLayer();
    this$1.setActiveLayer(layer);
  })();
  requestAnimationFrame(function () { return draw(); });
  this.setupUi();
  document.body.appendChild(view);
}


var _setup = Object.freeze({
	setup: setup
});

/**
 * @return {Boolean}
 */
function hasResized$1() {
  var ox = this.bounds.x; var oy = this.bounds.y;
  var ow = this.bounds.w; var oh = this.bounds.h;
  var nx = this.last.x; var ny = this.last.y;
  var nw = this.last.w; var nh = this.last.h;
  return (
    ox !== nx || oy !== ny ||
    ow !== nw || oh !== nh
  );
}

function updateBoundings$1() {
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var batches = this.batches;
  var count = 0;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    var bounds = batch.bounds;
    var bx = bounds.x; var by = bounds.y;
    var bw = bx + bounds.w; var bh = by + bounds.h;
    // ignore empty batches
    if (bounds.w === 0 && bounds.h === 0) { continue; }
    // calculate x
    if (x < 0 && bx < x) { x = bx; }
    else if (x >= 0 && (bx < 0 || bx < x)) { x = bx; }
    // calculate y
    if (y < 0 && by < y) { y = by; }
    else if (y >= 0 && (by < 0 || by < y)) { y = by; }
    // calculate width
    if (bw > w) { w = bw; }
    // calculate height
    if (bh > h) { h = bh; }
    count++;
  }
  // update our boundings
  if (count > 0) {
    var bounds$1 = this.bounds;
    this.last.x = bounds$1.x; this.last.y = bounds$1.y;
    this.last.w = bounds$1.w; this.last.h = bounds$1.h;
    bounds$1.update(
      x, y,
      -x + w, -y + h
    );
  }
  if (this.hasResized()) {
    var main = this.batch;
    main.bounds.update(
      this.bounds.x, this.bounds.y,
      this.bounds.w, this.bounds.h
    );
    var xx = this.last.x; var yy = this.last.y;
    var ww = this.last.w; var hh = this.last.h;
    main.resizeMatrix(
      xx - this.bounds.x, yy - this.bounds.y,
      this.bounds.w - ww, this.bounds.h - hh
    );
  }
}

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getPixelAt$1(x, y) {
  var bw = this.bounds.w;
  var bh = this.bounds.h;
  // normalize coordinates
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  // now get the pixel from the layer matrix
  return (this.batch.getRawPixelAt(dx, dy));
}

/**
 * Access live pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getLivePixelAt$1(x, y) {
  var this$1 = this;

  var bw = this.bounds.w;
  var bh = this.bounds.h;
  // normalize coordinates
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var xx = dx - this.bounds.x;
  var yy = dy - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) { return (null); }
  for (var ii = 0; ii < this.batches.length; ++ii) {
    var idx = (this$1.batches.length - 1) - ii;
    var batch = this$1.batches[idx];
    var pixel = batch.getRawPixelAt(dx, dy);
    if (pixel !== null) { return (pixel); }
  }
  return (null);
}

/**
 * Merges two layers
 * Resize this by layer<->this bounding diff
 * Inject this matrix into layer matrix at layer bound pos
 * @param {Layer} layer
 */
function mergeWithLayer$1(layer, state) {
  this.batches.push(layer.batch);
  this.updateBoundings();
  this.batch.injectMatrix(layer.batch, state);
  this.batch.refreshTexture(true);
}


var _matrix$2 = Object.freeze({
	hasResized: hasResized$1,
	updateBoundings: updateBoundings$1,
	getPixelAt: getPixelAt$1,
	getLivePixelAt: getLivePixelAt$1,
	mergeWithLayer: mergeWithLayer$1
});

/**
 * @class {Layer}
 */
var Layer$2 = function Layer(instance) {
  this.id = uid();
  this.instance = instance;
  // position
  this.x = 0;
  this.y = 0;
  // last boundings
  this.last = { x: 0, y: 0, w: 0, h: 0 };
  // we can name layers
  this.index = this.generateLayerNameIndex();
  this._name = "Layer " + this.index;
  // reference to ui node
  this.node = null;
  // opacity applied over local batches
  this.opacity = 255.0;
  // layer batch matrix
  this.batch = null;
  // batches we hold here
  this.batches = [];
  // relative boundings
  this.bounds = new Boundings();
  // layer states get/set base
  this._visible = true;
  this._locked = false;
  this.allocateLayerMatrix();
};

var prototypeAccessors$1 = { name: {},visible: {},locked: {} };
/**
 * @return {String}
 */
prototypeAccessors$1.name.get = function () {
  return (this._name);
};
/**
 * @param {String}
 */
prototypeAccessors$1.name.set = function (value) {
  this._name = value;
  var node = this.node.querySelector(".layer-text");
  node.value = value;
};
/**
 * @return {Boolean}
 */
prototypeAccessors$1.visible.get = function () {
  return (this._visible);
};
/**
 * @param {Boolean} state
 */
prototypeAccessors$1.visible.set = function (state) {
  this._visible = state;
  this.instance.redraw = true;
  var node = this.node.querySelector(".layer-item-visible");
  node.src = state ? "assets/img/visible.png" : "assets/img/invisible.png";
};
/**
 * @return {Boolean}
 */
prototypeAccessors$1.locked.get = function () {
  return (this._locked);
};
/**
 * @param {Boolean} state
 */
prototypeAccessors$1.locked.set = function (state) {
  this._locked = state;
  this.instance.redraw = true;
  var node = this.node.querySelector(".layer-item-locked");
  node.src = state ? "assets/img/locked.png" : "assets/img/unlocked.png";
};

Object.defineProperties( Layer$2.prototype, prototypeAccessors$1 );

Layer$2.prototype.allocateLayerMatrix = function() {
  var instance = this.instance;
  this.batch = instance.createDynamicBatch(0, 0);
  // add reference to unused layer so we can use
  // the batch matrix logic for our layers too
  // but without including layer x,y in calculations
  this.batch.layer = instance.cache.layer;
};

/**
 * @return {Layer}
 */
Layer$2.prototype.clone = function() {
  var layer = new Layer$2(this.instance);
  var batch = this.batch.clone();
  layer.last = Object.assign(layer.last);
  layer.opacity = this.opacity;
  layer.bounds = this.bounds.clone();
  layer.x = this.x; layer.y = this.y;
  layer.batch = batch;
  layer.batches.push(batch);
  //layer.visible = this.visible;
  //layer.locked = this.locked;
  return (layer);
};

/**
 * @return {Number}
 */
Layer$2.prototype.getIndex = function() {
  var this$1 = this;

  var layers = this.instance.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    if (this$1.id === layer.id) { return (ii); }
  }
  return (-1);
};

Layer$2.prototype.removeFromLayers = function() {
  var this$1 = this;

  var layers = this.instance.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    if (this$1.id === layer.id) { layers.splice(ii, 1); }
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
Layer$2.prototype.createBatchAt = function(x, y) {
  var dx = (x - this.x) | 0;
  var dy = (y - this.y) | 0;
  var batch = new Batch(this.instance);
  batch.prepareMatrix(dx, dy);
  this.addBatch(batch);
  return (batch);
};

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer$2.prototype.addBatch = function(batch) {
  batch.layer = this;
  this.batches.push(batch);
};

/**
 * @param {Number} id
 * @return {Number}
 */
Layer$2.prototype.getBatchById = function(id) {
  var result = null;
  var batches = this.batches;
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    if (batch.id === id) {
      result = batch;
      break;
    }
  }
  return (result);
};

/**
 * Auto generates a layer index name
 * and filles missing layer indices
 * @return {Number}
 */
Layer$2.prototype.generateLayerNameIndex = function() {
  var layers = this.instance.layers;
  // clone, take numeric index, sort ascending, es6 left its muck here
  var sorted = layers.concat().map(function (item) { return item.index; }).sort(function (a, b) { return a - b; });
  for (var ii = 0; ii < sorted.length; ++ii) {
    if (sorted.indexOf(ii) < 0) { return (ii); }
  }
  return (layers.length);
};

/**
 * yuck in here, yuck in here
 */
Layer$2.prototype.addUiReference = function() {
  var tmpl = "\n    <div class=\"layer-item\">\n      <img class=\"layer-item-visible\" src=\"assets/img/visible.png\">\n      <img class=\"layer-item-locked\" src=\"assets/img/unlocked.png\">\n      <input class=\"layer-text\" value=\"" + (this.name) + "\" readonly />\n    </div>\n  ";
  var parser = new DOMParser();
  var html = parser.parseFromString(tmpl, "text/html").querySelector(".layer-item");
  var index = this.getIndex();
  var layers = this.instance.layers;
  var ctx = window.layers;
  if (index >= ctx.children.length) {
    window.layers.appendChild(html);
  } else {
    window.layers.insertBefore(html, ctx.children[index]);
  }
  // save reference to inserted layer node
  this.node = html;
};

Layer$2.prototype.removeUiReference = function() {
  this.node.parentNode.removeChild(this.node);
  this.node = null;
};

extend(Layer$2, _matrix$2);

/**
 * @class {Poxi}
 */
var Poxi = function Poxi() {
  // # webgl related
  // wgl context
  this.gl = null;
  // canvas reference
  this.view = null;
  // webgl program
  this.program = null;
  // global boundings
  this.bounds = new Boundings();
  // # camera related
  this.cx = 0;
  this.cy = 0;
  this.cw = 0;
  this.ch = 0;
  // camera render scale
  this.cr = BASE_SCALE;
  this.cs = BASE_SCALE;
  // camera drag related
  this.dx = 0;
  this.dy = 0;
  // camera zoom related
  this.lx = 0;
  this.ly = 0;
  // selection related
  this.sx = 0;
  this.sy = 0;
  this.sw = -0;
  this.sh = -0;
  this.shape = null;
  // mouse offset
  this.mx = 0;
  this.my = 0;
  // stack related
  this.stack = [];
  this.sindex = -1;
  // layer related
  this.layers = [];
  // general cache
  this.cache = {
    bg: null,
    fg: null,
    // unused base layer
    layer: null,
    fgTexture: null,
    grid: null,
    gridTexture: null,
    // wgl cache
    gl: {
      // empty texture
      empty: null,
      // general buffers
      buffers: {},
      // we use buffered uv coords
      vertices: {},
      // texture pool
      textures: {}
    }
  };
  // last things
  this.last = {
    cx: 1, cy: 1,
    // mouse move coordinates
    mx: 0, my: 0,
    // mouse down coordinates
    mdx: 0, mdy: 0,
    // mouse down relative coordinates
    mdrx: 0, mdry: 0
  };
  // shared buffer related
  this.buffers = {
    arc: null,
    rect: null,
    move: null,
    stroke: null,
    erasing: null,
    drawing: null
  };
  // keyboard related
  this.keys = {};
  // clipboard related
  this.clipboard = {
    copy: null
  };
  // stage stages
  this.states = {
    arc: false,
    rect: false,
    stroke: false,
    moving: false,
    drawing: false,
    pipette: false,
    lighting: false,
    dragging: false,
    select: false,
    selecting: false,
    fastColorMenu: false
  };
  // mode related
  this.modes = {
    arc: false,
    move: false,
    fill: false,
    rect: false,
    draw: false,
    shape: false,
    light: false,
    erase: false,
    flood: false,
    select: false,
    stroke: false,
    pipette: false
  };
  // indicates if we have to redraw our stage
  this.redraw = false;
  // global fill style
  this.fillStyle = [0, 0, 0, 0];
  // favorite used colors
  this.favoriteColors = [];
  // selected active layer
  this.activeLayer = null;
  this.setup();
};

extend(Poxi, _select);
extend(Poxi, _area_functions);

extend(Poxi, _camera);

extend(Poxi, _emitter);
extend(Poxi, _listener);

extend(Poxi, _env);
extend(Poxi, _fill);
extend(Poxi, _insert);

extend(Poxi, _buffer);
extend(Poxi, _build);
extend(Poxi, _draw);
extend(Poxi, _generate);
extend(Poxi, _main);
extend(Poxi, _render);
extend(Poxi, _resize);
extend(Poxi, _shaders);

extend(Poxi, _redo);
extend(Poxi, _state);
extend(Poxi, _undo);

extend(Poxi, _read);
extend(Poxi, _write);

extend(Poxi, _transflip);
extend(Poxi, _transrotate);

extend(Poxi, _ui);

extend(Poxi, _setup);

if (typeof window !== "undefined") {
  window.Poxi = Poxi;
  window.stage = new Poxi();
} else {
  throw new Error("Poxi only runs inside the browser");
}
})();