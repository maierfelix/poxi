'use strict';

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
  var x = this.sx; var y = this.sy;
  var w = this.sw; var h = this.sh;
  if (w < 0) { x += w; }
  if (h < 0) { y += h; }
  w = w < 0 ? -w : w;
  h = h < 0 ? -h : h;
  return ({
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
}

function resetSelection() {
  this.sx = this.sy = 0;
  this.sw = this.sh = -0;
}


var _select = Object.freeze({
	getSelection: getSelection,
	selectFrom: selectFrom,
	selectTo: selectTo,
	resetSelection: resetSelection
});

var CommandKind = {
  DRAW: 0,
  ERASE: 1,
  FILL: 2,
  BACKGROUND: 3,
  PASTE: 4,
  CUT: 5,
  DRAW_IMAGE: 6,
  RECT_FILL: 7,
  RECT_STROKE: 8,
  ARC_FILL: 9,
  ARC_STROKE: 10,
  FLOOD_FILL: 11
};

/**
 * @param {Object} selection
 */
function copy(selection) {
  var this$1 = this;

  var x = selection.x; var y = selection.y;
  var w = selection.w; var h = selection.h;
  var pixels = [];
  this.clipboard.copy = null;
  for (var ii = 0; ii < w * h; ++ii) {
    var xx = ii % w;
    var yy = (ii / w) | 0;
    var pixel = this$1.getPixelAt(x + xx, y + yy);
    if (pixel === null) { continue; }
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  }
  this.clipboard.copy = pixels;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} pixels
 * @return {Void}
 */
function paste(x, y, pixels) {
  if (pixels === null || !pixels.length) { return; }
  var batch = this.createDynamicBatch();
  var layer = this.getCurrentLayer();
  batch.prepareBuffer(x, y);
  for (var ii = 0; ii < pixels.length; ++ii) {
    var pixel = pixels[ii];
    var color = pixel.color;
    batch.drawTile(pixel.x + x, pixel.y + y, 1, 1, color);
  }
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.PASTE, batch);
  return;
}

/**
 * @param {Object} selection
 * @return {Void}
 */
function cut(selection) {
  this.copy(selection);
  var pixels = this.clipboard.copy;
  if (pixels === null || !pixels.length) { return; }
  this.clearRect(selection);
  return;
}

/**
 * @param {Object} selection
 * @return {Void}
 */
function clearRect(selection) {
  var x = selection.x; var y = selection.y;
  var w = selection.w; var h = selection.h;
  var batch = this.createDynamicBatch();
  var layer = this.getCurrentLayer();
  batch.isEraser = true;
  batch.prepareBuffer(x, y);
  batch.clearRect(x, y, w, h);
  batch.refreshTexture();
  // empty batch, got no tiles to delete
  if (!batch.erased.length) { return; }
  layer.addBatch(batch);
  this.enqueue(CommandKind.CLEAR, batch);
  return;
}


var _area_functions = Object.freeze({
	copy: copy,
	paste: paste,
	cut: cut,
	clearRect: clearRect
});

// default view size


// default grid hidden or not


var TILE_SIZE = 8;
var MIN_SCALE = 1;
var MAX_SCALE = 32;
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

var GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
var ZOOM_SPEED = 15;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */


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
  DEV: false
};

// different settings
var SETTINGS = {
  PENCIL_SIZE: 2,
  ERASER_SIZE: 2
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
  this.redraw();
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
function drag(x, y) {
  x = x | 0;
  y = y | 0;
  this.cx += x - this.dx;
  this.cy += y - this.dy;
  this.dx = x;
  this.dy = y;
  this.redraw();
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
	click: click,
	hover: hover,
	drag: drag,
	getRelativeOffset: getRelativeOffset,
	getRelativeTileOffset: getRelativeTileOffset,
	getTileOffsetAt: getTileOffsetAt,
	boundsInsideView: boundsInsideView
});



var _emitter = Object.freeze({

});

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
 * @return {Array}
 */




/**
 * Convert rgba to rgba byte color
 * @param {Array} rgba
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
  this.onMouseUp(e);
}

/**
 * @param {Event} e
 */
function onMouseLeave(e) {
  e.preventDefault();
  this.onMouseUp(e);
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
}

/**
 * @param {Event} e
 */
function onMouseDown(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) {
    this.processUIClick(e.target);
    return;
  }
  var x = e.clientX;
  var y = e.clientY;
  var relative = this.getRelativeTileOffset(x, y);
  if (e.which === 1) {
    this.resetSelection();
    if (this.modes.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else if (this.modes.arc) {
      this.states.arc = true;
      this.buffers.arc = this.createDynamicBatch();
      var batch = this.buffers.arc;
      var layer = this.getCurrentLayer();
      batch.forceRendering = true;
      batch.prepareBuffer(relative.x, relative.y);
      batch.refreshTexture();
      layer.addBatch(batch);
    }
    else if (this.modes.rect) {
      this.states.rect = true;
      this.buffers.rect = this.createDynamicBatch();
      var batch$1 = this.buffers.rect;
      var layer$1 = this.getCurrentLayer();
      batch$1.forceRendering = true;
      batch$1.prepareBuffer(relative.x, relative.y);
      batch$1.refreshTexture();
      layer$1.addBatch(batch$1);
    }
    else if (this.modes.draw) {
      this.states.drawing = true;
      this.buffers.drawing = this.createDynamicBatch();
      var batch$2 = this.buffers.drawing;
      var layer$2 = this.getCurrentLayer();
      batch$2.forceRendering = true;
      batch$2.prepareBuffer(relative.x, relative.y);
      batch$2.drawAt(relative.x, relative.y, SETTINGS.PENCIL_SIZE, this.fillStyle);
      batch$2.refreshTexture();
      layer$2.addBatch(batch$2);
    }
    else if (this.modes.erase) {
      this.states.erasing = true;
      this.buffers.erasing = this.createDynamicBatch();
      var batch$3 = this.buffers.erasing;
      var layer$3 = this.getCurrentLayer();
      batch$3.forceRendering = true;
      batch$3.prepareBuffer(relative.x, relative.y);
      batch$3.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
      batch$3.refreshTexture();
      batch$3.isEraser = true;
      layer$3.addBatch(batch$3);
    }
    else if (this.modes.stroke) {
      this.states.stroke = true;
      this.buffers.stroke = this.createDynamicBatch();
      var batch$4 = this.buffers.stroke;
      var layer$4 = this.getCurrentLayer();
      batch$4.forceRendering = true;
      batch$4.prepareBuffer(relative.x, relative.y);
      batch$4.refreshTexture();
      layer$4.addBatch(batch$4);
    }
    else if (this.modes.flood) {
      this.floodPaint(relative.x, relative.y);
    }
    else if (this.modes.fill) {
      this.fillBucket(relative.x, relative.y, this.fillStyle);
    }
    else if (this.modes.pipette) {
      var color = this.getPixelAt(relative.x, relative.y);
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

var lastx = 0;
var lasty = 0;
/**
 * @param {Event} e
 */
function onMouseMove(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) { return; }
  var x = e.clientX;
  var y = e.clientY;
  var last = this.last;
  var layer = this.getCurrentLayer();
  var relative = this.getRelativeTileOffset(x, y);
  // mouse polling rate isn't 'per-pixel'
  // so we try to interpolate missed offsets
  if (this.states.dragging) {
    this.drag(x, y);
  }
  this.hover(x, y);
  if (last.mx === relative.x && last.my === relative.y) { return; }
  if (this.states.arc) {
    var batch = this.buffers.arc;
    batch.clear();
    var start = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    var radius = pointDistance(start.x, start.y, relative.x, relative.y);
    this.strokeArc(batch, start.x, start.y, radius, this.fillStyle);
    layer.updateBoundings();
    batch.refreshTexture();
  }
  else if (this.states.rect) {
    var batch$1 = this.buffers.rect;
    batch$1.clear();
    var start$1 = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    var ww = relative.x - start$1.x;
    var hh = relative.y - start$1.y;
    this.strokeRect(batch$1, start$1.x, start$1.y, ww, hh, this.fillStyle);
    layer.updateBoundings();
    batch$1.refreshTexture();
  }
  else if (this.states.stroke) {
    var batch$2 = this.buffers.stroke;
    batch$2.clear();
    this.insertLine(this.last.mdrx, this.last.mdry, relative.x, relative.y);
    layer.updateBoundings();
    batch$2.refreshTexture();
  }
  else if (this.states.drawing) {
    var batch$3 = this.buffers.drawing;
    this.insertLine(x, y, lastx, lasty);
    layer.updateBoundings();
    batch$3.refreshTexture();
  }
  else if (this.states.erasing) {
    var batch$4 = this.buffers.erasing;
    var layer$1 = this.getCurrentLayer();
    this.insertLine(x, y, lastx, lasty);
    batch$4.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
    if (!batch$4.isEmpty()) { layer$1.updateBoundings(); }
  }
  else if (this.states.dragging) {
    this.drag(x, y);
  }
  else if (this.states.selecting) {
    this.selectTo(x, y);
  }
  lastx = x; lasty = y;
  last.mx = relative.x; last.my = relative.y;
}

/**
 * @param {Event} e
 */
function onMouseUp(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) { return; }
  if (e.which === 1) {
    if (this.modes.arc) {
      var batch = this.buffers.arc;
      batch.forceRendering = false;
      this.states.arc = false;
      this.enqueue(CommandKind.ARC_FILL, batch);
      this.buffers.arc = null;
    }
    else if (this.modes.rect) {
      var batch$1 = this.buffers.rect;
      batch$1.forceRendering = false;
      this.states.rect = false;
      this.enqueue(CommandKind.RECT_FILL, batch$1);
      this.buffers.rect = null;
    }
    else if (this.modes.stroke) {
      var batch$2 = this.buffers.stroke;
      batch$2.forceRendering = false;
      this.states.stroke = false;
      this.enqueue(CommandKind.STROKE, batch$2);
      this.buffers.stroke = null;
    }
    else if (this.modes.select) {
      this.states.selecting = false;
    }
    else if (this.states.drawing) {
      var batch$3 = this.buffers.drawing;
      batch$3.forceRendering = false;
      this.states.drawing = false;
      this.enqueue(CommandKind.DRAW, batch$3);
      this.buffers.drawing = null;
    }
    else if (this.states.erasing) {
      var batch$4 = this.buffers.erasing;
      batch$4.forceRendering = false;
      this.states.erasing = false;
      if (batch$4.isEmpty()) { batch$4.kill(); }
      else { this.enqueue(CommandKind.ERASE, batch$4); }
      this.buffers.erasing = null;
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
  e.preventDefault();
  var code = e.keyCode;
  this.keys[code] = 1;
  switch (code) {
    // del
    case 46:
      this.clearRect(this.getSelection());
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
        this.paste(this.last.mx, this.last.my, this.clipboard.copy);
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
    break;
    // f5
    case 116:
      location.reload();
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
  if (code === 16) {
    this.states.select = false;
    this.states.selecting = false;
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
  e.preventDefault();
  var x = e.clientX;
  var y = e.clientY;
  var value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
}


var _listener = Object.freeze({
	initListeners: initListeners,
	onResize: onResize,
	onMouseOut: onMouseOut,
	onMouseLeave: onMouseLeave,
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
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRawPixelAt(x, y) {
  // normalize coordinates
  var xx = x - this.bounds.x;
  var yy = y - this.bounds.y;
  // now extract the data
  var data = this.data;
  // imagedata array is 1d
  var idx = (yy * this.bounds.w + xx) * 4;
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

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
function drawImage(ctx, x, y) {
  var view = ctx.canvas;
  var ww = view.width;
  var hh = view.height;
  var xx = alignToGrid(x - (ww / 2) | 0);
  var yy = alignToGrid(y - (hh / 2) | 0);
  this.prepareBuffer(xx, yy);
  this.buffer = ctx;
  this.bounds.x = xx;
  this.bounds.y = yy;
  this.bounds.w = ww;
  this.bounds.h = hh;
  this.refreshTexture();
}


var _raw = Object.freeze({
	getRawPixelAt: getRawPixelAt,
	drawImage: drawImage
});

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} size
 * @param {Array} color 
 */
function drawAt(x, y, size, color) {
  var xpad = Math.ceil(size / 2);
  var ypad = Math.ceil(size / 2);
  this.drawTile(
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
function drawTile(x, y, w, h, color) {
  var bounds = this.bounds;
  this.resizeByOffset(x, y);
  // resize a second time to update boundings to given w,h
  if (w > 1 || h > 1) {
    this.resizeByOffset(x + w - 1, y + h - 1);
  }
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    w, h
  );
}

/**
 * Fastest way to draw a tile
 * This method doesnt do auto resizing!
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {Array} color
 */
function drawSilentTile(x, y, w, h, color) {
  var bounds = this.bounds;
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    w, h
  );
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
function clearRect$1(x, y, w, h) {
  var this$1 = this;

  var batches = [];
  var bounds = this.bounds;
  var instance = this.instance;
  for (var ii = 0; ii < w * h; ++ii) {
    var xx = (ii % w) + x;
    var yy = ((ii / w) | 0) + y;
    var erased = this$1.eraseTileAt(xx, yy);
    for (var jj = 0; jj < erased.length; ++jj) {
      var batch = erased[jj];
      if (batches.indexOf(batch) <= -1) { batches.push(batch); }
    }
  }
  for (var ii$1 = 0; ii$1 < batches.length; ++ii$1) {
    batches[ii$1].refreshTexture();
  }
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Array} Returns changed batches
 */
function eraseTileAt(x, y) {
  var this$1 = this;

  var batches = [];
  var pixels = this.instance.getPixelsAt(x, y).pixels;
  if (pixels.length) { this.resizeByOffset(x, y); }
  for (var ii = 0; ii < pixels.length; ++ii) {
    this$1.erased.push(pixels[ii]);
    var batch = pixels[ii].batch;
    var pixel = pixels[ii].pixel;
    var xx = x - batch.bounds.x;
    var yy = y - batch.bounds.y;
    // clear old batch
    batch.buffer.clearRect(
      xx, yy,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) { batches.push(batch); }
  }
  return (batches);
}


var _tile = Object.freeze({
	drawAt: drawAt,
	drawTile: drawTile,
	drawSilentTile: drawSilentTile,
	clearAt: clearAt,
	clearRect: clearRect$1,
	eraseTileAt: eraseTileAt
});

/**
 * Erases related pixel tiles in given batches
 */
function dejectErasedTiles() {
  var tiles = this.erased;
  var batches = [];
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    var batch = tile.batch;
    var x = tile.x - batch.bounds.x;
    var y = tile.y - batch.bounds.y;
    // clear old batch
    batch.buffer.clearRect(
      x, y,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) { batches.push(batch); }
  }
  // make sure to refresh a batch's buffer only once
  batches.map(function (batch) { return batch.refreshTexture(); });
}

/**
 * Redraws related pixel tiles in given batches
 */
function injectErasedTiles() {
  var tiles = this.erased;
  var batches = [];
  for (var ii = 0; ii < tiles.length; ++ii) {
    var tile = tiles[ii];
    var batch = tile.batch;
    var color = colorToRgbaString(tile.pixel);
    var x = tile.x - batch.bounds.x;
    var y = tile.y - batch.bounds.y;
    batch.buffer.fillStyle = color;
    batch.buffer.fillRect(
      x, y,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) { batches.push(batch); }
  }
  // make sure to refresh a batch's buffer only once
  batches.map(function (batch) { return batch.refreshTexture(); });
}


var _erase = Object.freeze({
	dejectErasedTiles: dejectErasedTiles,
	injectErasedTiles: injectErasedTiles
});

/**
 * @param {Number} x
 * @param {Number} y
 */
function resizeByOffset(x, y) {
  var bounds = this.bounds;
  var w = (Math.abs(bounds.x - x) | 0) + 1;
  var h = (Math.abs(bounds.y - y) | 0) + 1;
  var ox = bounds.x; var oy = bounds.y;
  var ow = bounds.w; var oh = bounds.h;
  var xx = -(bounds.x - x) | 0;
  var yy = -(bounds.y - y) | 0;
  // resize bound rect to left
  if (xx < 0) {
    bounds.x += xx;
    bounds.w += Math.abs(xx);
  }
  // resize bound rect to top
  if (yy < 0) {
    bounds.y += yy;
    bounds.h += Math.abs(yy);
  }
  if (w > bounds.w) { bounds.w = w; }
  if (h > bounds.h) { bounds.h = h; }
  // make sure we only resize if necessary
  if (ow !== bounds.w || oh !== bounds.h) {
    // create new resized buffer and draw old content into it
    var buffer = createCanvasBuffer(bounds.w, bounds.h);
    buffer.drawImage(
      this.buffer.canvas,
      ox - bounds.x, oy - bounds.y,
      ow, oh
    );
    // now set our new buffer to our final buffer
    // with the new size as well as the old content
    this.buffer = buffer;
    this.isResized = true;
  }
}

function resizeByBufferData() {
  var data = this.data;
  var bounds = this.bounds;
  var bx = bounds.x; var by = bounds.y;
  var bw = bounds.w; var bh = bounds.h;
  var ox = bounds.x; var oy = bounds.y;
  var ow = bounds.w; var oh = bounds.h;
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = ii / 4;
    var xx = idx % bw;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    var r = data[px + 0];
    var g = data[px + 1];
    var b = data[px + 2];
    var a = data[px + 3];
    // ignore empty tiles
    if ((r + g + b <= 0) || a <= 0) { continue; }
    // x, y
    if (xx >= 0 && xx <= x) { x = xx; }
    if (yy >= 0 && yy <= y) { y = yy; }
    // width, height
    if (xx >= 0 && xx >= w) { w = xx; }
    if (yy >= 0 && yy >= h) { h = yy; }
  }
  var nx = (w - (-x + w));
  var ny = (h - (-y + h));
  var nbx = bounds.x + nx; var nby = bounds.y + ny;
  var nbw = (-x + w) + 1; var nbh = (-y + h) + 1;
  // abort if nothing has changed
  if (ox === nbx && oy === nby && ow === nbw && oh === nbh) { return; }
  bounds.x = nbx; bounds.y = nby;
  bounds.w = nbw; bounds.h = nbh;
  // redraw the old buffer without the resized tiles
  var buffer = createCanvasBuffer(bounds.w, bounds.h);
  buffer.drawImage(
    this.buffer.canvas,
    -nx, -ny
  );
  this.buffer = buffer;
  // trigger a full resize of our buffer
  this.isResized = true;
  return;
}


var _resize = Object.freeze({
	resizeByOffset: resizeByOffset,
	resizeByBufferData: resizeByBufferData
});



var _boundings = Object.freeze({

});

/**
 * @class Batch
 */
var Batch = function Batch(instance) {
  this.id = uid();
  this.instance = instance;
  this.erased = [];
  // buffer related
  this.data = null;
  this.buffer = null;
  this.texture = null;
  // relative boundings
  this.bounds = new Boundings();
  // batch got resized or not
  this.isResized = false;
  // we use this batch for erasing
  this.isEraser = false;
  // indicates if we should force to render this batch
  this.forceRendering = false;
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

Batch.prototype.clear = function() {
  this.buffer.clearRect(
    0, 0,
    this.bounds.w, this.bounds.h
  );
};

Batch.prototype.kill = function() {
  var id = this.id;
  var instance = this.instance;
  var layers = instance.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var batches = layers[ii].batches;
    for (var jj = 0; jj < batches.length; ++jj) {
      var batch = batches[jj];
      // also kill references in erased cell array
      if (batch.isEraser) {
        for (var kk = 0; kk < batch.erased.length; ++kk) {
          var tile = batch.erased[kk];
          if (tile.batch.id === id) { continue; }
          batch.erased.splice(kk, 1);
        }
      }
      if (batch.id === id) {
        batch.bounds = null;
        batch.erased = null;
        batch.instance.destroyTexture(batch.texture);
        batches.splice(jj, 1);
        layers[ii].updateBoundings();
        break;
      }
    }
  }
};

/**
 * Get color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getColorAt = function(x, y) {
  // nothing buffered
  if (this.isEmpty()) { return (null); }
  // use image data for raw buffers
  return (this.getRawColorAt(x, y));
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.prepareBuffer = function(x, y) {
  // we don't have a buffer to store data at yet
  if (this.buffer === null) {
    var bounds = this.bounds;
    bounds.x = x;
    bounds.y = y;
    bounds.w = 1;
    bounds.h = 1;
    this.buffer = createCanvasBuffer(1, 1);
    this.texture = this.instance.bufferTexture(this.id, this.buffer.canvas, false);
    this.isResized = true;
  }
};

Batch.prototype.refreshTexture = function() {
  var bounds = this.bounds;
  var instance = this.instance;
  this.data = this.buffer.getImageData(0, 0, bounds.w, bounds.h).data;
  if (this.isResized) {
    instance.destroyTexture(this.texture);
    this.texture = instance.bufferTexture(this.id, this.buffer.canvas, false);
  } else {
    instance.updateTexture(this.texture, this.buffer.canvas);
  }
  this.isResized = false;
};

/**
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  if (this.isEraser) { return (this.erased.length <= 0); }
  var data = this.data;
  var bw = this.bounds.w;
  var count = 0;
  for (var ii = 0; ii < data.length; ii += 4) {
    var idx = ii / 4;
    var xx = idx % bw;
    var yy = (idx / bw) | 0;
    var px = (yy * bw + xx) * 4;
    var r = data[px + 0];
    var g = data[px + 1];
    var b = data[px + 2];
    var a = data[px + 3];
    // ignore empty tiles
    if ((r + g + b <= 0) || a <= 0) { continue; }
    count++;
  }
  return (count <= 0);
};

extend(Batch, _raw);
extend(Batch, _tile);
extend(Batch, _erase);
extend(Batch, _resize);
extend(Batch, _boundings);

function resetModes() {
  var this$1 = this;

  for (var key in this.modes) {
    this$1.resetSelection();
    this$1.modes[key] = false;
  }
  this.resetActiveUiButtons();
}

/**
 * @return {String}
 */
function exportAsDataUrl() {
  if (!(this.cache.main instanceof CanvasRenderingContext2D)) { return (""); }
  var buffer = this.cache.main;
  var view = buffer.canvas;
  return (view.toDataURL("image/png"));
}

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getPixelAt(x, y) {
  var sindex = this.sindex;
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var idx = layers.length - 1 - ii; // reversed
    var batches = layers[idx].batches;
    for (var jj = 0; jj < batches.length; ++jj) {
      var jdx = batches.length - 1 - jj;
      var batch = batches[jdx];
      if (batch.isEraser) { continue; }
      if (!batch.bounds.isPointInside(x, y)) { continue; }
      if (batch.getStackIndex() > sindex) { continue; }
      var pixel = batch.getRawPixelAt(x, y);
      if (pixel !== null) { return (pixel); }
    }
  }
  return (null);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function getPixelsAt(x, y) {
  var result = [];
  var sindex = this.sindex;
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var idx = layers.length - 1 - ii; // reversed
    var batches = layers[idx].batches;
    for (var jj = 0; jj < batches.length; ++jj) {
      var jdx = batches.length - 1 - jj;
      var batch = batches[jdx];
      if (batch.isEraser) { continue; }
      if (!batch.bounds.isPointInside(x, y)) { continue; }
      if (batch.getStackIndex() > sindex) { continue; }
      var pixel = batch.getRawPixelAt(x, y);
      if (pixel === null) { continue; }
      result.push({
        x: x, y: y,
        batch: batch,
        pixel: pixel
      });
    }
  }
  return ({
    x: x, y: y,
    pixels: result
  });
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
function getLayerByPoint(x, y) {
  var layers = this.layers;
  for (var ii = 0; ii < layers.length; ++ii) {
    var idx = layers.length - 1 - ii;
    var layer = layers[idx];
    if (layer.bounds.isPointInside(x, y)) { return (layer); }
  }
  return (null);
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
function getCurrentLayer() {
  if (this.layers.length) {
    return (this.layers[this.layers.length - 1]);
  }
  return (null);
}

/**
 * @return {Batch}
 */
function createDynamicBatch() {
  var batch = new Batch(this);
  return (batch);
}

function refreshMainTexture() {
  this.createMainBuffer();
}

function updateGlobalBoundings() {
  var this$1 = this;

  for (var ii = 0; ii < this.layers.length; ++ii) {
    this$1.layers[ii].updateBoundings();
  }
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var layers = this.layers;
  for (var ii$1 = 0; ii$1 < layers.length; ++ii$1) {
    var layer = layers[ii$1];
    var bounds = layer.bounds;
    var bx = bounds.x; var by = bounds.y;
    var bw = bx + bounds.w; var bh = by + bounds.h;
    // ignore empty layers
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
  }
  // update our boundings
  this.bounds.update(x, y, -x + w, -y + h);
}


var _env = Object.freeze({
	resetModes: resetModes,
	exportAsDataUrl: exportAsDataUrl,
	getPixelAt: getPixelAt,
	getPixelsAt: getPixelsAt,
	getLayerByPoint: getLayerByPoint,
	getBatchById: getBatchById,
	getCurrentLayer: getCurrentLayer,
	createDynamicBatch: createDynamicBatch,
	refreshMainTexture: refreshMainTexture,
	updateGlobalBoundings: updateGlobalBoundings
});



var _blend = Object.freeze({

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
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @param {Boolean} linear
 * @return {WebGLTexture}
 */
function bufferTexture(name, canvas, linear) {
  var gl = this.gl;
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
 * @param {HTMLCanvasElement} canvas 
 */
function updateTexture(texture, canvas) {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var _buffer = Object.freeze({
	bufferTexture: bufferTexture,
	destroyTexture: destroyTexture,
	updateTexture: updateTexture
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
function clear() {
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
function drawImage$1(tex, dx, dy, dw, dh) {
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
	clear: clear,
	drawImage: drawImage$1,
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
  this.cache.gridTexture = this.bufferTexture("grid", buffer.canvas, true);
  this.redrawGridBuffer();
  return (buffer);
}

function redrawGridBuffer() {
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
  this.updateTexture(texture, buffer.canvas);
  this.last.cx = this.cx;
  this.last.cy = this.cy;
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
  var texture = this.bufferTexture("background", canvas, false);
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
  this.cache.fgTexture = this.bufferTexture("foreground", buffer.canvas, true);
  return (buffer);
}

function createMainBuffer() {
  var ww = this.bounds.w;
  var hh = this.bounds.h;
  var buffer = createCanvasBuffer(ww || 1, hh || 1);
  if (this.cache.main !== null) {
    this.cache.main = null;
    this.destroyTexture(this.cache.mainTexture);
  }
  this.cache.main = buffer;
  this.cache.mainTexture = this.bufferTexture("main", buffer.canvas, false);
  this.updateMainBuffer();
  return (buffer);
}

function updateMainBuffer() {
  var this$1 = this;

  var layers = this.layers;
  var sindex = this.sindex;
  var buffer = this.cache.main;
  for (var ii = 0; ii < layers.length; ++ii) {
    var layer = layers[ii];
    var lx = layer.x;
    var ly = layer.y;
    var batches = layer.batches;
    for (var jj = 0; jj < batches.length; ++jj) {
      var batch = batches[jj];
      var x = batch.bounds.x;
      var y = batch.bounds.y;
      var w = batch.bounds.w;
      var h = batch.bounds.h;
      if (sindex - jj < 0) { continue; }
      buffer.drawImage(
        batch.buffer.canvas,
        lx + (x - this$1.bounds.x), ly + (y - this$1.bounds.y)
      );
    }
  }
  this.updateTexture(this.cache.mainTexture, buffer.canvas);
}


var _generate = Object.freeze({
	createGridBuffer: createGridBuffer,
	redrawGridBuffer: redrawGridBuffer,
	createBackgroundBuffer: createBackgroundBuffer,
	createForegroundBuffer: createForegroundBuffer,
	createMainBuffer: createMainBuffer,
	updateMainBuffer: updateMainBuffer
});

function redraw() {
  // only redraw texture if it's absolutely necessary
  if (this.last.cx !== this.cx || this.last.cy !== this.cy) {
    this.redrawGridBuffer();
  }
}

/**
 * Returns state if we can render
 * a cached version of our view buffer
 * @return {Boolean}
 */
function canRenderCachedBuffer() {
  return (
    this.cache.main !== null &&
    !this.states.drawing &&
    !this.states.erasing &&
    !this.states.arc &&
    !this.states.rect &&
    !this.states.stroke
  );
}

/** Main render method */
function render() {
  var selection = this.sw !== -0 && this.sh !== -0;
  this.renderBackground();
  this.renderGrid();
  if (this.canRenderCachedBuffer()) {
    var bounds = this.bounds;
    var cx = this.cx | 0;
    var cy = this.cy | 0;
    var cr = this.cr;
    var ww = this.cache.main.canvas.width;
    var hh = this.cache.main.canvas.height;
    this.drawImage(
      this.cache.mainTexture,
      cx + (bounds.x * TILE_SIZE) * cr, cy + (bounds.y * TILE_SIZE) * cr,
      (ww * TILE_SIZE) * cr, (hh * TILE_SIZE) * cr
    );
  } else {
    this.renderLayers();
  }
  if (!this.states.select || !selection) {
    this.renderHoveredTile();
  }
  if (selection) { this.renderSelection(); }
  if (MODES.DEV) { this.renderStats(); }
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

/** Render all layers */
function renderLayers() {
  var this$1 = this;

  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  var layers = this.layers;
  // draw global boundings
  for (var ii = 0; ii < this.layers.length; ++ii) {
    var layer = layers[ii];
    var bounds = layer.bounds;
    if (layer.states.hidden) { continue; }
    //if (!this.boundsInsideView(bounds)) continue;
    if (MODES.DEV) {
      var x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
      var y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
      var w = (bounds.w * TILE_SIZE) * cr;
      var h = (bounds.h * TILE_SIZE) * cr;
      this$1.drawRectangle(
        x, y,
        w, h,
        this$1.buffers.boundingColor
      );
    }
    this$1.renderLayer(layer);
  }
}

/**
 * @param {Layer} layer
 */
function renderLayer(layer) {
  var this$1 = this;

  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  var lx = layer.x * TILE_SIZE;
  var ly = layer.y * TILE_SIZE;
  var batches = layer.batches;
  var opacity = layer.opacity;
  var sindex = this.sindex;
  // reset renderer opacity into original state
  var oopacity = opacity;
  if (opacity !== 255.0) { this.setOpacity(opacity); }
  for (var ii = 0; ii < batches.length; ++ii) {
    var batch = batches[ii];
    var bounds = batch.bounds;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - ii < 0 && !batch.isEraser) {
      if (!batch.forceRendering) { continue; }
    }
    if (!this$1.boundsInsideView(bounds)) { continue; }
    // draw batch boundings
    var x = (cx + (lx + (bounds.x * TILE_SIZE) * cr)) | 0;
    var y = (cy + (ly + (bounds.y * TILE_SIZE) * cr)) | 0;
    var w = (bounds.w * TILE_SIZE) * cr;
    var h = (bounds.h * TILE_SIZE) * cr;
    if (MODES.DEV) {
      if (batch.isEraser && batch.isEmpty()) { continue; }
      this$1.drawRectangle(
        x, y,
        w, h,
        this$1.buffers.boundingColor
      );
    }
    this$1.drawImage(
      batch.texture,
      x, y,
      w, h
    );
  }
  if (opacity !== 255.0) { this.setOpacity(oopacity); }
}

function renderHoveredTile() {
  var cx = this.cx | 0;
  var cy = this.cy | 0;
  var cr = this.cr;
  // apply empty tile hover color
  var mx = this.mx;
  var my = this.my;
  var relative = this.getRelativeTileOffset(mx, my);
  //console.log(relative.x, relative.y);
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
  var color = this.getPixelAt(mx, my);
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
  this.updateTexture(texture, view);
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
	redraw: redraw,
	canRenderCachedBuffer: canRenderCachedBuffer,
	render: render,
	renderBackground: renderBackground,
	renderGrid: renderGrid,
	renderLayers: renderLayers,
	renderLayer: renderLayer,
	renderHoveredTile: renderHoveredTile,
	renderSelection: renderSelection,
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
}


var _resize$1 = Object.freeze({
	resize: resize
});

/**
 * @class Command
 */
var Command = function Command(kind, batch) {
  this.kind = 0;
  this.batch = batch;
};

function redo$1() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    var cmd = this.currentStackOperation();
    this.fire(cmd, true);
  }
  this.refreshMainTexture();
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
  this.undo();
  this.redo();
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
  this.updateGlobalBoundings();
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
  if (!cmd) { return; }
  if (cmd.batch.isEraser) {
    if (state) { cmd.batch.dejectErasedTiles(); }
    else { cmd.batch.injectErasedTiles(); }
  }
}


var _state = Object.freeze({
	refreshStack: refreshStack,
	currentStackOperation: currentStackOperation,
	fire: fire
});

function undo$1() {
  if (this.sindex >= 0) {
    var cmd = this.currentStackOperation();
    this.fire(cmd, false);
    this.sindex--;
  }
  this.refreshMainTexture();
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
    cmd.batch.kill();
    this$1.stack.splice(idx, 1);
  }
}


var _undo = Object.freeze({
	undo: undo$1,
	dequeue: dequeue
});



var _read = Object.freeze({

});



var _write = Object.freeze({

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
  var base = this.getPixelAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) { return; }
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  // save the current stack index
  var sindex = this.sindex;
  var batch = this.createDynamicBatch();
  var layer = this.getCurrentLayer();
  // flood fill
  var result = this.binaryFloodFill(batch, x, y, base, color);
  // ups, we filled infinite
  if (result) { return; }
  layer.addBatch(batch);
  var kind = result ? CommandKind.BACKGROUND : CommandKind.FILL;
  this.enqueue(kind, batch);
  this.updateGlobalBoundings();
  return;
}

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive" cells at the grid,
 * then we take the boundings of the used/filled area of our grid and crop out
 * the relevant part. Then we convert the filled grid area into a raw buffer
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Boolean}
 */
function binaryFloodFill(batch, x, y, base, color) {
  var this$1 = this;

  var bounds = this.bounds;
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
    var color$1 = this$1.getPixelAt(bx + xx, by + yy);
    // empty tile based
    if (isEmpty) { if (color$1 !== null) { continue; } }
    // color based
    else {
      if (color$1 === null) { continue; }
      if (!(base[0] === color$1[0] && base[1] === color$1[1] && base[2] === color$1[2])) { continue; }
    }
    // fill tiles with 1's if we got a color match
    grid[yy * gw + xx] = 1;
  }

  // trace connected tiles by [x,y]=2
  var queue = [{x: x - bx, y: y - by}];
  while (queue.length > 0) {
    var point = queue.pop();
    var x$1 = point.x;
    var y$1 = point.y;
    var idx = y$1 * gw + x$1;
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) { grid[idx] = 2; }
    var nn = (y$1-1) * gw + x$1;
    var ee = y$1 * gw + (x$1+1);
    var ss = (y$1+1) * gw + x$1;
    var ww = y$1 * gw + (x$1-1);
    // abort if we possibly go infinite
    if (
      (y$1 - 1 < -1 || y$1 - 1 > gh) ||
      (x$1 + 1 < -1 || x$1 + 1 > gw) ||
      (y$1 + 1 < -1 || y$1 + 1 > gh) ||
      (x$1 - 1 < -1 || x$1 - 1 > gw)
    ) { return (true); }
    if (grid[nn] === 1) { queue.push({x: x$1, y:y$1-1}); }
    if (grid[ee] === 1) { queue.push({x:x$1+1, y: y$1}); }
    if (grid[ss] === 1) { queue.push({x: x$1, y:y$1+1}); }
    if (grid[ww] === 1) { queue.push({x:x$1-1, y: y$1}); }
  }

  // convert cropped area into raw buffer
  var buffer = createCanvasBuffer(gw, gh);
  buffer.fillStyle = colorToRgbaString(color);
  for (var ii$1 = 0; ii$1 < gw * gh; ++ii$1) {
    var xx$1 = ii$1 % gw;
    var yy$1 = (ii$1 / gw) | 0;
    if (grid[yy$1 * gw + xx$1] !== 2) { continue; }
    buffer.fillRect(
      xx$1, yy$1, 1, 1
    );
  }

  // update batch with final result
  batch.buffer = buffer;
  batch.data = buffer.getImageData(0, 0, gw, gh).data;
  batch.bounds.update(bx, by, gw, gh);
  batch.isResized = true;
  batch.resizeByBufferData();
  batch.refreshTexture();

  // finally free things from memory
  grid = null;

  return (false);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
function floodPaint(x, y) {
  var this$1 = this;

  var color = this.fillStyle;
  var base = this.getPixelAt(x, y);
  // empty base tile or colors to fill are the same
  if (base === null || colorsMatch(base, color)) { return; }
  var xx = this.bounds.x;
  var yy = this.bounds.y;
  var ww = this.bounds.w;
  var hh = this.bounds.h;
  var layer = this.getCurrentLayer();
  var batch = this.createDynamicBatch();
  batch.prepareBuffer(xx, yy);
  batch.resizeByOffset(xx, yy);
  batch.resizeByOffset(xx + ww, yy + hh);
  // flood paint
  var count = 0;
  for (var ii = 0; ii < ww * hh; ++ii) {
    var x$1 = (ii % ww);
    var y$1 = (ii / ww) | 0;
    var pixel = this$1.getPixelAt(xx + x$1, yy + y$1);
    if (pixel === null) { continue; }
    if (!colorsMatch(base, pixel)) { continue; }
    batch.drawTile(xx + x$1, yy + y$1, 1, 1, color);
    count++;
  }
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.isResized = true;
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.FLOOD_FILL, batch);
  return;
}


var _fill = Object.freeze({
	fillBucket: fillBucket,
	binaryFloodFill: binaryFloodFill,
	floodPaint: floodPaint
});



var _rotate = Object.freeze({

});

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
function insertImage(ctx, x, y) {
  var layer = this.getCurrentLayer();
  var batch = this.createDynamicBatch();
  batch.drawImage(ctx, x, y);
  layer.addBatch(batch);
  this.enqueue(CommandKind.DRAW_IMAGE, batch);
}

/**
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 */
function insertLine(x0, y0, x1, y1) {
  var this$1 = this;

  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = (x0 < x1) ? 1 : -1;
  var sy = (y0 < y1) ? 1 : -1;
  var err = dx - dy;

  var last = this.last;
  var batch = (
    this.states.drawing ?
    this.buffers.drawing :
    this.states.stroke ? 
    this.buffers.stroke :
    this.buffers.erasing
  );
  while (true) {
    var w = SETTINGS.PENCIL_SIZE;
    var h = SETTINGS.PENCIL_SIZE;
    if (this$1.states.drawing) {
      var relative = this$1.getRelativeTileOffset(x0, y0);
      batch.drawTile(relative.x, relative.y, w, h, this$1.fillStyle);
    }
    else if (this$1.states.erasing) {
      var relative$1 = this$1.getRelativeTileOffset(x0, y0);
      batch.clearAt(relative$1.x, relative$1.y, SETTINGS.ERASER_SIZE);
    }
    else if (this$1.states.stroke) {
      batch.drawTile(x0, y0, w, h, this$1.fillStyle);
    }
    if (x0 === x1 && y0 === y1) { break; }
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
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
  this.insertArc(batch, x, y, radius, color);
}

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
function insertArc(batch, x1, y1, radius, color) {
  var x2 = radius;
  var y2 = 0;
  var err = 1 - x2;
  var w = SETTINGS.PENCIL_SIZE;
  var h = SETTINGS.PENCIL_SIZE;
  for (; x2 >= y2;) {
    batch.drawTile(x2 + x1, y2 + y1, w, h, color);
    batch.drawTile(y2 + x1, x2 + y1, w, h, color);
    batch.drawTile(-x2 + x1, y2 + y1, w, h, color);
    batch.drawTile(-y2 + x1, x2 + y1, w, h, color);
    batch.drawTile(-x2 + x1, -y2 + y1, w, h, color);
    batch.drawTile(-y2 + x1, -x2 + y1, w, h, color);
    batch.drawTile(x2 + x1, -y2 + y1, w, h, color);
    batch.drawTile(y2 + x1, -x2 + y1, w, h, color);
    y2++;
    if (err <= 0) {
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2--;
      err += 2 * (y2 - x2) + 1;
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
function fillRect(batch, x, y, width, height, color) {
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
  var bx = x1;
  var by = y1;
  var width = Math.abs(x2);
  var height = Math.abs(y2);
  var dx = (x2 < 0 ? -1 : 1);
  var dy = (y2 < 0 ? -1 : 1);
  var w = SETTINGS.PENCIL_SIZE;
  var h = SETTINGS.PENCIL_SIZE;
  for (var yy = 0; yy < height; ++yy) {
    for (var xx = 0; xx < width; ++xx) {
      // ignore inner tiles if rectangle not filled
      if (!filled) {
        if (!(
          (xx === 0 || xx >= width-1) ||
          (yy === 0 || yy >= height-1))
        ) { continue; }
      }
      batch.drawTile(bx + xx * dx, by + yy * dy, w, h, color);
    }
  }
}


var _insert = Object.freeze({
	insertImage: insertImage,
	insertLine: insertLine,
	strokeArc: strokeArc,
	insertArc: insertArc,
	fillRect: fillRect,
	strokeRect: strokeRect,
	insertRectangleAt: insertRectangleAt
});

function resetActiveUiButtons() {
  arc.style.removeProperty("opacity");
  move.style.removeProperty("opacity");
  tiled.style.removeProperty("opacity");
  erase.style.removeProperty("opacity");
  bucket.style.removeProperty("opacity");
  select.style.removeProperty("opacity");
  stroke.style.removeProperty("opacity");
  pipette.style.removeProperty("opacity");
  rectangle.style.removeProperty("opacity");
  paint_all.style.removeProperty("opacity");
}

function setUiColor(value) {
  color_hex.innerHTML = String(value).toUpperCase();
  color_view.style.background = value;
  this.fillStyle = hexToRgba(value);
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
  color.onchange = function (e) {
    this$1.setUiColor(color.value);
  };
  this.setUiColor(rgbaToHex(this.fillStyle));

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
        ctx.drawImage(img, 0, 0, img.width, img.height);
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

}


var _ui = Object.freeze({
	resetActiveUiButtons: resetActiveUiButtons,
	setUiColor: setUiColor,
	setupUi: setupUi
});

/**
 * @class {Layer}
 */
var Layer = function Layer(instance) {
  this.id = uid();
  // position
  this.x = 0;
  this.y = 0;
  // we can name layers
  this.name = null;
  // opacity applied over local batches
  this.opacity = 255.0;
  // buffered texture of all our local batches
  this.buffer = null;
  // batches we hold here
  this.batches = [];
  // relative boundings
  this.bounds = new Boundings();
  // different layer states
  this.states = {
    hidden: false,
    locked: false
  };
};

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer.prototype.addBatch = function(batch) {
  this.batches.push(batch);
  if (!batch.isEmpty()) { this.updateBoundings(); }
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

Layer.prototype.updateBoundings = function() {
  var x = MAX_SAFE_INTEGER; var y = MAX_SAFE_INTEGER;
  var w = -MAX_SAFE_INTEGER; var h = -MAX_SAFE_INTEGER;
  var batches = this.batches;
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
  }
  // update our boundings
  this.bounds.update(x, y, -x + w, -y + h);
};

function setup() {
  var this$1 = this;

  var view = document.createElement("canvas");
  var width = window.innerWidth;
  var height = window.innerHeight;
  view.width = width;
  view.height = height;
  this.setupRenderer(view);
  this.initListeners();
  this.resize(width, height);
  this.scale(0);
  this.modes.draw = true;
  tiled.style.opacity = 1.0;
  var draw = function () {
    requestAnimationFrame(function () { return draw(); });
    this$1.clear();
    this$1.render();
  };
  draw();
  // add some things manually
  (function () {
    this$1.layers.push(new Layer());
  })();
  this.setupUi();
  document.body.appendChild(view);
}


var _setup = Object.freeze({
	setup: setup
});

/**
 * @class {Poxi}
 */
var Poxi = function Poxi() {
  // # webgl related
  // wgl context
  this.gl = null;
  // canvas reference
  this.view = null;
  // empty texture
  this.empty = null;
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
  this.cr = MIN_SCALE;
  this.cs = MIN_SCALE;
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
  // mouse offset
  this.mx = 0;
  this.my = 0;
  // stack related
  this.stack = [];
  this.sindex = 0;
  // layer related
  this.layers = [];
  // general cache
  this.cache = {
    main: null,
    mainTexture: null,
    bg: null,
    fg: null,
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
    stroke: false,
    erasing: null,
    drawing: null,
    boundingColor: [1, 0, 0, 0.1]
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
    drawing: false,
    dragging: false,
    select: false,
    selecting: false
  };
  // mode related
  this.modes = {
    arc: false,
    fill: false,
    rect: false,
    draw: false,
    erase: false,
    flood: false,
    select: false,
    stroke: false,
    pipette: false
  };
  // global fill style
  this.fillStyle = [255, 0, 0, 1];
  this.setup();
};

extend(Poxi, _select);
extend(Poxi, _area_functions);

extend(Poxi, _camera);

extend(Poxi, _emitter);
extend(Poxi, _listener);

extend(Poxi, _env);

extend(Poxi, _blend);
extend(Poxi, _invert);
extend(Poxi, _onion);
extend(Poxi, _replace);
extend(Poxi, _shading);
extend(Poxi, _smoothing);

extend(Poxi, _buffer);
extend(Poxi, _build);
extend(Poxi, _draw);
extend(Poxi, _generate);
extend(Poxi, _render);
extend(Poxi, _resize$1);
extend(Poxi, _shaders);

extend(Poxi, _redo);
extend(Poxi, _state);
extend(Poxi, _undo);

extend(Poxi, _read);
extend(Poxi, _write);

extend(Poxi, _fill);
extend(Poxi, _rotate);
extend(Poxi, _insert);

extend(Poxi, _ui);

extend(Poxi, _setup);

if (typeof window !== "undefined") {
  window.Poxi = Poxi;
  window.stage = new Poxi();
} else {
  throw new Error("Poxi only runs inside the browser");
}
