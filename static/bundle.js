'use strict';

/**
 * @param {Class} cls
 * @param {Array} prot
 */
var extend = function(cls, prot) {
  for (let key in prot) {
    if (prot[key] instanceof Function) {
      if (cls.prototype[key] instanceof Function) {
        console.log(`Warning: Overwriting ${cls.name}.prototype.${key}`);
      }
      cls.prototype[key] = prot[key];
    }
  }
};

/**
 * @param {Number} x
 * @param {Number} y
 */
function selectFrom(x, y) {
  x = x | 0;
  y = y | 0;
  const relative = this.getRelativeTileOffset(x, y);
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
  const relative = this.getRelativeTileOffset(x, y);
  const w = relative.x - this.sx;
  const h = relative.y - this.sy;
  this.sw = w + (w >= 0 ? 1 : 0);
  this.sh = h + (h >= 0 ? 1 : 0);
}


var _select = Object.freeze({
	selectFrom: selectFrom,
	selectTo: selectTo
});

// default view size


// default grid hidden or not


const TILE_SIZE = 8;
const MIN_SCALE = 1.25;
const MAX_SCALE = 32;
const MAGIC_SCALE = .125;
// trace ghost tiles by alpha=^2


const SELECTION_COLOR = [1, 1, 1, 0.2];
const TILE_HOVER_COLOR = [1, 1, 1, 0.2];

// 32-bit ints are allowed at maximum
const MAX_SAFE_INTEGER = (2 ** 31) - 1;

// alpha byte to rgb-alpha conversion
const MAGIC_RGB_A_BYTE = 0.00392;

// factor when to hide the grid

const GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
const ZOOM_SPEED = 15;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */


// Maximum allowed items inside stack
const STACK_LIMIT = 128;

// WebGL texture limit
const WGL_TEXTURE_LIMIT = STACK_LIMIT * 2;

// WebGL supported or not
const WGL_SUPPORTED = (
  typeof WebGLRenderingContext !== "undefined"
);

// WebAssembly supported or not

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
  const i = 1 / t;
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
  x1 = x1 | 0; y1 = y1 | 0;
  w1 = w1 | 0; h1 = h1 | 0;
  x2 = x2 | 0; y2 = y2 | 0;
  w2 = w2 | 0; h2 = h2 | 0;
  const xx = Math.max(x1, x2);
  const ww = Math.min(x1 + w1, x2 + w2);
  const yy = Math.max(y1, y2);
  const hh = Math.min(y1 + h1, y2 + h2);
  return (ww >= xx && hh >= yy);
}

/**
 * @param {Number} dir
 */
function scale(dir) {
  const x = (dir * (ZOOM_SPEED / 1e2)) * zoomScale(this.cs);
  const oscale = this.cs;
  if (this.cs + x <= MIN_SCALE) this.cs = MIN_SCALE;
  else if (this.cs + x >= MAX_SCALE) this.cs = MAX_SCALE;
  else this.cs += x;
  this.cs = roundTo(this.cs, MAGIC_SCALE);
  if (this.cs >= (MAX_SCALE - 1) + .25) this.cs = (MAX_SCALE - 1) + .25;
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
  const position = this.getRelativeOffset(x, y);
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
  this.mx = x;
  this.my = y;
  const relative = this.getRelativeTileOffset(x, y);
  this.rmx = relative.x * TILE_SIZE;
  this.rmy = relative.y * TILE_SIZE;
  this.redraw();
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
  const xx = (x - this.cx) / this.cs;
  const yy = (y - this.cy) / this.cs;
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
  const rel = this.getRelativeOffset(x, y);
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
  const half = TILE_SIZE / 2;
  const xx = roundTo(x - half, TILE_SIZE);
  const yy = roundTo(y - half, TILE_SIZE);
  return ({
    x: (xx / TILE_SIZE) | 0,
    y: (yy / TILE_SIZE) | 0
  });
}

/**
 * @param {Boundings} bounds 
 */
function boundsInsideView(bounds) {
  const cs = this.cs;
  const ww = (bounds.w * TILE_SIZE) * cs;
  const hh = (bounds.h * TILE_SIZE) * cs;
  const xx = ((bounds.x * TILE_SIZE) * cs) + this.cx;
  const yy = ((bounds.y * TILE_SIZE) * cs) + this.cy;
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

function initListeners() {

  window.addEventListener("resize", (e) => this.onResize(e));

  window.addEventListener("mouseout", (e) => this.onMouseOut(e));
  window.addEventListener("mouseleave", (e) => this.onMouseLeave(e));

  window.addEventListener("mousedown", (e) => this.onMouseDown(e));
  window.addEventListener("mouseup", (e) => this.onMouseUp(e));

  window.addEventListener("mousemove", (e) => this.onMouseMove(e));

  window.addEventListener("keydown", (e) => this.onKeyDown(e));
  window.addEventListener("keyup", (e) => this.onKeyUp(e));

  window.addEventListener("contextmenu", (e) => this.onContextmenu(e));

  window.addEventListener("wheel", (e) => this.onMouseWheel(e));
  window.addEventListener("mousewheel", (e) => this.onMouseWheel(e));

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

}

/**
 * @param {Event} e
 */
function onMouseLeave(e) {
  e.preventDefault();

}

/**
 * @param {Event} e
 */
function onMouseDown(e) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  if (e.which === 1) {
    // debug helper
    (() => {
      const relative = this.getRelativeTileOffset(x, y);
      console.log(relative.x, relative.y);
    })();
    if (this.states.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else {
      this.states.drawing = true;
    }
  }
  else if (e.which === 3) {
    this.states.dragging = true;
    this.click(x, y);
  }
}

/**
 * @param {Event} e
 */
function onMouseUp(e) {
  e.preventDefault();
  if (e.which === 1) {
    if (this.states.select) {
      this.sx = this.sy = 0;
      this.sw = this.sh = -0;
      this.states.select = false;
      this.states.selecting = false;
    }
    else if (this.states.drawing) {
      this.states.drawing = false;
    }
  }
  if (e.which === 3) {
    this.states.dragging = false;
  }
}

/**
 * @param {Event} e
 */
function onMouseMove(e) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  this.hover(x, y);
  if (this.states.selecting) {
    this.selectTo(x, y);
  }
  else if (this.states.drawing) {
    const relative = this.getRelativeTileOffset(x, y);
    this.drawTileAt(relative.x, relative.y);
  }
  if (this.states.dragging) {
    this.drag(x, y);
  }
}

/**
 * @param {Event} e
 */
function onKeyDown(e) {
  const code = e.keyCode;
  // shift
  if (code === 16) {
    this.states.select = true;
  }
  else if (code === 116) location.reload();
}

/**
 * @param {Event} e
 */
function onKeyUp(e) {
  const code = e.keyCode;
  if (code === 16) {
    this.states.select = false;
    this.states.selecting = false;
    this.sx = this.sy = 0;
    this.sw = this.sh = -0;
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
  const x = e.clientX;
  const y = e.clientY;
  const value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
}


var _listener = Object.freeze({
	initListeners: initListeners,
	onResize: onResize,
	onMouseOut: onMouseOut,
	onMouseLeave: onMouseLeave,
	onMouseDown: onMouseDown,
	onMouseUp: onMouseUp,
	onMouseMove: onMouseMove,
	onKeyDown: onKeyDown,
	onKeyUp: onKeyUp,
	onContextmenu: onContextmenu,
	onMouseWheel: onMouseWheel
});

/**
 * Returns unique integer
 * @return {Number}
 */
let uidx = 0;
function uid() {
  return (++uidx);
}

/**
 * @param {Number} width
 * @param {Number} height
 * @return {CanvasRenderingContext2D}
 */
function createCanvasBuffer(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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


/**
 * @param {Array} color
 * @return {String}
 */


/**
 * @param {String} hex
 * @return {Array}
 */


/**
 * @param {Array} rgba
 * @return {String}
 */


/**
 * Do rgba color arrays match
 * @param {Array} a
 * @param {Array} a
 * @return {Boolean}
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
  const opts = {
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
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
function getBatchByPoint(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const batches = layers[idx].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const jdx = batches.length - 1 - jj;
      const batch = batches[jdx];
      if (!batch.isPointInside(x, y)) continue;
      if (this.sindex < jdx) continue;
      return (batch);
    }
  }
  return (null);
}

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRawPixelAt(x, y) {
  // normalize coordinates
  const xx = x - this.cx;
  const yy = y - this.cy;
  // abort if point isn't inside our global boundings
  if (
    (xx < 0 || xx >= this.cw) ||
    (yy < 0 || yy >= this.ch)
  ) return (null);
  const batch = this.getBatchByPoint(xx, yy);
  console.log(batch, xx, yy, x, y);
  /*
  // now extract the data
  const data = batch.buffer.data;
  // imagedata array is 1d
  const idx = (yy * this.cw + xx) * 4;
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);*/
}

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
function getLayerByPoint(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    if (layer.bounds.isPointInside(x, y)) return (layer);
  }
  return (null);
}

/**
 * @param {Number} x
 * @param {Number} y
 */
function drawTileAt(x, y) {
  const layer = this.getLayerByPoint(x, y);
  console.log(layer);
}


var _env = Object.freeze({
	getBatchByPoint: getBatchByPoint,
	getRawPixelAt: getRawPixelAt,
	getLayerByPoint: getLayerByPoint,
	drawTileAt: drawTileAt
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



var _smoothing = Object.freeze({

});

/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @param {Boolean} linear
 * @return {WebGLTexture}
 */
function bufferTexture(name, canvas, linear) {
  const gl = this.gl;
  const texture = gl.createTexture();
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
  const gl = this.gl;
  const textures = this.cache.gl.textures;
  for (let key in textures) {
    let txt = textures[key];
    if (txt !== texture) continue;
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
  const gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
}


var _buffer = Object.freeze({
	bufferTexture: bufferTexture,
	destroyTexture: destroyTexture,
	updateTexture: updateTexture
});

const SPRITE_VERTEX = `
  precision lowp float;
  uniform vec2 uScale;
  uniform vec2 uObjScale;
  attribute vec2 aObjCen;
  attribute float aIdx;
  varying vec2 uv;
  void main(void) {
    if (aIdx == 0.0) {
      uv = vec2(0.0,0.0);
    } else if (aIdx == 1.0) {
      uv = vec2(1.0,0.0);
    } else if (aIdx == 2.0) {
      uv = vec2(0.0,1.0);
    } else {
      uv = vec2(1.0,1.0);
    }
    gl_Position = vec4(
      -1.0 + 2.0 * (aObjCen.x + uObjScale.x * (-0.5 + uv.x)) / uScale.x,
      1.0 - 2.0 * (aObjCen.y + uObjScale.y * (-0.5 + uv.y)) / uScale.y,
      0.0, 1.0
    );
  }
`;

const SPRITE_FRAGMENT = `
  precision lowp float;
  uniform sampler2D uSampler;
  varying vec2 uv;
  uniform int isRect;
  uniform vec4 vColor;
  void main(void) {
    if (isRect == 0) {
      gl_FragColor = texture2D(uSampler, uv);
    } else {
      gl_FragColor = vColor + texture2D(uSampler, uv);
    }
    if (gl_FragColor.a < 0.1) discard;
  }
`;


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
  const gl = this.gl;
  const texture = gl.createTexture();
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
  const gl = this.gl;
  const size = WGL_TEXTURE_LIMIT;
  const program = gl.createProgram();
  const vshader = gl.createShader(gl.VERTEX_SHADER);
  const fshader = gl.createShader(gl.FRAGMENT_SHADER);

  this.compileShader(vshader, SPRITE_VERTEX);
  this.compileShader(fshader, SPRITE_FRAGMENT);

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);

  const cache = this.cache.gl;
  const buffers = cache.buffers;
  const vertices = cache.vertices;
  const idxs = vertices.idx = new Float32Array(size * 6);
  vertices.position = new Float32Array(size * 12);

  buffers.idx = gl.createBuffer();
  buffers.position = gl.createBuffer();
  for (let ii = 0; ii < size; ii++) {
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
  const gl = this.gl;
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
}

function setGlAttribute(program, buffer, name, size, values) {
  const gl = this.gl;
  const attribute = gl.getAttribLocation(program, name);
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
  const gl = this.gl;
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

  const gl = this.gl;
  const program = this.program;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );

  const pos = this.cache.gl.vertices.position;
  for (let ii = 0; ii < 6; ++ii) {
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

  const gl = this.gl;
  const program = this.program;

  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 1);

  const pos = this.cache.gl.vertices.position;
  for (let ii = 0; ii < 6; ++ii) {
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
	drawImage: drawImage,
	drawRectangle: drawRectangle
});

/**
 * @return {CanvasRenderingContext2D}
 */
function createGridBuffer() {
  const cw = this.cw;
  const ch = this.ch;
  const buffer = createCanvasBuffer(cw, ch);
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
  const buffer = this.cache.grid;
  const texture = this.cache.gridTexture;
  const cr = this.cr;
  const size = (TILE_SIZE * cr) | 0;
  const cx = this.cx;
  const cy = this.cy;
  const cw = this.cw;
  const ch = this.ch;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (let xx = (cx % size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  }
  for (let yy = (cy % size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  }
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.updateTexture(texture, buffer.canvas);
  this.lcx = this.cx;
  this.lcy = this.cy;
}

/**
 * @return {WebGLTexture}
 */
function createBackgroundBuffer() {
  if (this.cache.bg instanceof WebGLTexture) {
    this.destroyTexture(this.cache.bg);
  }
  const size = TILE_SIZE;
  const cw = this.cw;
  const ch = this.ch;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);
  // bright rectangles
  ctx.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    }
  }
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
    }
  }
  const texture = this.bufferTexture("background", canvas, false);
  return (texture);
}


var _generate = Object.freeze({
	createGridBuffer: createGridBuffer,
	redrawGridBuffer: redrawGridBuffer,
	createBackgroundBuffer: createBackgroundBuffer
});

function redraw() {
  // only redraw texture if it's absolutely necessary
  if (this.lcx !== this.cx || this.lcy !== this.cy) {
    this.redrawGridBuffer();
  }
  this.clear();
  this.render();
}

/** Main render method */
function render() {
  const selection = this.sw !== -0 && this.sh !== -0;
  this.renderBackground();
  this.renderGrid();
  this.renderLayers();
  if (!this.states.select || !selection) {
    this.renderHoveredTile();
  }
  if (selection) this.renderSelection();
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
  const cx = this.cx;
  const cy = this.cy;
  const cr = this.cr;
  const layers = this.layers;
  for (let ii = 0; ii < this.layers.length; ++ii) {
    const layer = layers[ii];
    if (layer.states.hidden) continue;
    if (!this.boundsInsideView(layer.bounds)) continue;
    const bounds = layer.bounds;
    const x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [255, 0, 0, 0.2]
    );
    this.renderLayer(layer);
  }
}

/**
 * @param {Layer} layer
 */
function renderLayer(layer) {
  const cx = this.cx;
  const cy = this.cy;
  const cr = this.cr;
  const lx = layer.x * TILE_SIZE;
  const ly = layer.y * TILE_SIZE;
  const batches = layer.batches;
  const opacity = layer.opacity;
  // reset renderer opacity into original state
  const oopacity = opacity;
  if (opacity !== 255.0) this.setOpacity(opacity);
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    // batch is a background, fill the whole screen
    if (batch.isBackground) {
      this.drawRectangle(
        0, 0,
        this.cw, this.ch,
        batch.color
      );
      continue;
    }
    // draw batch boundings
    const x = (cx + (lx + (bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + (lx + (bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [0, 0, 255, 0.2]
    );
    continue;
    this.drawImage(
      batch.texture,
      xx, yy
    );
  }
  if (opacity !== 255.0) this.setOpacity(oopacity);
}

function renderHoveredTile() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  // apply empty tile hover color
  const mx = this.mx;
  const my = this.my;
  const relative = this.getRelativeTileOffset(mx, my);
  //console.log(relative.x, relative.y);
  const rx = relative.x * TILE_SIZE;
  const ry = relative.y * TILE_SIZE;
  const x = ((cx + GRID_LINE_WIDTH/2) + (rx * cr)) | 0;
  const y = ((cy + GRID_LINE_WIDTH/2) + (ry * cr)) | 0;
  const ww = (TILE_SIZE * cr) | 0;
  const hh = (TILE_SIZE * cr) | 0;
  this.drawRectangle(
    x, y,
    ww, hh,
    TILE_HOVER_COLOR
  );
}

function renderSelection() {
  const cr = this.cr;
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const xx = (cx + (this.sx * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.sy * TILE_SIZE) * cr) | 0;
  const ww = ((this.sw * TILE_SIZE) * cr) | 0;
  const hh = ((this.sh * TILE_SIZE) * cr) | 0;
  this.drawRectangle(
    xx, yy,
    ww, hh,
    SELECTION_COLOR
  );
}


var _render = Object.freeze({
	redraw: redraw,
	render: render,
	renderBackground: renderBackground,
	renderGrid: renderGrid,
	renderLayers: renderLayers,
	renderLayer: renderLayer,
	renderHoveredTile: renderHoveredTile,
	renderSelection: renderSelection
});

/**
 * Resize
 * @param {Number} width
 * @param {Number} height
 */
function resize(width, height) {
  width = width | 0;
  height = height | 0;
  const gl = this.gl;
  const view = this.view;
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
  // re-generate our bg
  this.cache.bg = this.createBackgroundBuffer();
  // re-generate our grid
  this.cache.grid = this.createGridBuffer();
  this.redrawGridBuffer();
}


var _resize = Object.freeze({
	resize: resize
});

function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const op = this.currentStackOperation();
    this.fire(op, true);
  }
}

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


var _redo = Object.freeze({
	redo: redo,
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
 * @param {Array} op
 * @param {Boolean} state
 */
function fire(op, state) {
  op.batch.tiles.map((tile) => {
    const cindex = tile.cindex;
    if (state) {
      // redo
      tile.cindex -= (tile.cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (tile.cindex < tile.colors.length - 1 ? 1 : 0);
    }
  });
}


var _state = Object.freeze({
	refreshStack: refreshStack,
	currentStackOperation: currentStackOperation,
	fire: fire
});

function undo() {
  if (this.sindex >= 0) {
    const op = this.currentStackOperation();
    this.fire(op, false);
    this.sindex--;
  }
}

/**
 * Dequeue items from stack
 * @param {Number} from
 * @param {Number} to
 */
function dequeue(from, to) {
  from = from + 1;
  const count = (to - (from - 1));
  const batches = this.batches;
  // free all following (more recent) tile batches
  for (let ii = count; ii > 0; --ii) {
    let batch = this.batches.splice(from + ii - 1, 1)[0];
    // free batch from memory
    if (batch.buffer.texture instanceof WebGLTexture) {
      batch.tiles = [];
      batch.buffer.view = null;
      batch.buffer.data = null;
      batch.buffer.context = null;
      this.renderer.destroyTexture(batch.buffer.texture);
      batch.buffer.texture = null;
      batch.buffer = null;
    }
    batch = null;
    this.refreshBatches();
    this.stack.splice(from + ii - 1, 1);
  }
}


var _undo = Object.freeze({
	undo: undo,
	dequeue: dequeue
});



var _read = Object.freeze({

});



var _write = Object.freeze({

});



var _fill = Object.freeze({

});



var _rotate = Object.freeze({

});

/**
 * @class Boundings
 */
class Boundings {
  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Number} w
   * @param {Number} h
   */
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.update(x, y, w, h);
  };
}

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
  const state = intersectRectangles(
    this.x, this.y, this.w - 1, this.h - 1,
    x, y, 0, 0
  );
  return (state);
};

/**
 * @param {CanvasRenderingContext2D}
 * @param {Number} x
 * @param {Number} y
 */
function createRawBufferAt(ctx, x, y) {
  const view = ctx.canvas;
  this.bounds.update(x, y, view.width, view.height);
  this.isBuffered = true;
  this.isRawBuffer = true;
  this.isBackground = false;
  this.buffer = {
    ctx,
    view: ctx.view,
    data: ctx.getImageData(0, 0, view.width, view.height)
  };
}

/**
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
function getRawColorAt(x, y) {
  const bounds = this.bounds;
  // normalize our point
  const xx = x - bounds.x;
  const yy = y - bounds.y;
  // abort if point isn't inside our buffer boundings
  if (
    (xx < 0 || xx >= bounds.w) ||
    (yy < 0 || yy >= bounds.h)
  ) return (null);
  // now extract the data
  const data = this.buffer.data;
  // imagedata array is 1d
  const idx = (yy * bounds.w + xx) * 4;
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return ([r, g, b, alphaByteToRgbAlpha(a)]);
}


var _raw = Object.freeze({
	createRawBufferAt: createRawBufferAt,
	getRawColorAt: getRawColorAt
});

/**
 * Updates the batch's relative position and size
 * @return {Void}
 */
function updateBoundings() {
  const info = this.getBoundings();
  this.bx = info.x;
  this.by = info.y;
  this.bw = info.w;
  this.bh = info.h;
}

/**
 * @return {Object}
 */
function getBoundings() {
  let x = 0;
  let y = 0;
  let w = 0;
  let h = 0;
  // background boundings are infinite
  if (this.isBackground) {
    x = y = -Infinity;
    w = h = Infinity;
  } else {
    x = 0;
    y = 0;
    w = 8;
    h = 8;
  }
  return ({x, y, w, h});
}


var _boundings = Object.freeze({
	updateBoundings: updateBoundings,
	getBoundings: getBoundings
});

/**
 * @class Batch
 */
class Batch {
  constructor() {
    this.id = uid();
    // buffer related
    this.buffer = null;
    this.isBuffered = false;
    // relative boundings
    this.bounds = new Boundings();
    // background related
    this.color = null;
    this.isBackground = false;
    // if we only have raw data
    this.isRawBuffer = false;
    this.erased = [];
  }
}

/**
 * Batch is completely empty
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  return (
    !this.isBuffered &&
    !this.isRawBuffer &&
    !this.isBackground
  );
};

/**
 * Get color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getColorAt = function(x, y) {
  // nothing buffered
  if (this.isEmpty()) return (null);
  // use image data for raw buffers
  if (this.isRawBuffer) {
    const color = this.getRawColorAt(x, y);
    if (color !== null) return (color);
  }
  // return background color if batch is a filled background
  if (this.isBackground) return (this.color);
  // wat is going on
  return (null);
};

extend(Batch, _raw);
extend(Batch, _boundings);

/**
 * @class {Layer}
 */
class Layer {
  /**
   * @constructor
   */
  constructor() {
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
  }
}

/**
 * Push batch and auto update layer boundings
 * @param {Batch} batch
 */
Layer.prototype.pushBatch = function(batch) {
  this.batches.push(batch);
  this.updateBoundings();
};

/**
 * Generates and updates the local view buffer, based on all stored batches
 */
Layer.prototype.updateBuffer = function() {
  this.buffer = null;
};

Layer.prototype.updateBoundings = function() {
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  const batches = this.batches;
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    const bx = bounds.x; const by = bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // calculate x
    if (x < 0 && bx < x) x = bx;
    else if (x >= 0 && (bx < 0 || bx < x)) x = bx;
    // calculate y
    if (y < 0 && by < y) y = by;
    else if (y >= 0 && (by < 0 || by < y)) y = by;
    // calculate width
    if (bw > w) w = bw;
    // calculate height
    if (bh > h) h = bh;
  }
  // update our boundings property
  this.bounds.update(x, y, -x + w, -y + h);
};

function setup() {
  const view = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  view.width = width;
  view.height = height;
  this.setupRenderer(view);
  this.initListeners();
  this.resize(width, height);
  this.scale(0);
  const draw = () => {
    requestAnimationFrame(() => draw());
    this.clear();
    this.render();
  };
  draw();
  // add some things manually
  (() => {
    let batch = new Batch();
    batch.bounds.x = 8;
    batch.bounds.y = 8;
    batch.bounds.w = 2;
    batch.bounds.h = 3;
    let batch2 = new Batch();
    batch2.bounds.x = -2;
    batch2.bounds.y = 2;
    batch2.bounds.w = 2;
    batch2.bounds.h = 2;
    let layer = new Layer();
    layer.pushBatch(batch);
    layer.pushBatch(batch2);
    this.layers.push(layer);
  })();
  document.body.appendChild(view);
}


var _setup = Object.freeze({
	setup: setup
});

/**
 * @class {Poxi}
 */
class Poxi {
  /**
   * @constructor
   */
  constructor() {
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
    // last camera position
    this.lcx = 1;
    this.lcy = 1;
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
    this.rmx = 0;
    this.rmy = 0;
    // stack related
    this.stack = [];
    this.sindex = 0;
    // layer related
    this.layers = [];
    // general cache
    this.cache = {
      bg: null,
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
    this.states = {
      drawing: false,
      dragging: false,
      select: false,
      selecting: false
    };
    this.setup();
  }
}

extend(Poxi, _select);

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
extend(Poxi, _resize);
extend(Poxi, _shaders);

extend(Poxi, _redo);
extend(Poxi, _state);
extend(Poxi, _undo);

extend(Poxi, _read);
extend(Poxi, _write);

extend(Poxi, _fill);
extend(Poxi, _rotate);

extend(Poxi, _setup);

if (typeof window !== "undefined") {
  window.Poxi = Poxi;
  window.stage = new Poxi();
} else {
  throw new Error("Poxi only runs inside the browser");
}

module.exports = Poxi;
