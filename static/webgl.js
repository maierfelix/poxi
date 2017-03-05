(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Default view width
 * @type {Number}
 */

const DEFAULT_WIDTH = 640;

/**
 * Default view height
 * @type {Number}
 */
const DEFAULT_HEIGHT = 480;

/**
 * Default maximum sprites
 * @type {Boolean}
 */
const DEFAULT_MAX_SPRITES = 1e3;

/**
 * Default image smoothing state
 * @type {Boolean}
 */
const DEFAULT_IMAGE_SMOOTHING = false;

/**
 * WGL support state
 * @type {Boolean}
 */
const WGLSupported = typeof WebGLRenderingContext !== "undefined";

/**
 * Returns an unique number
 * @return {Number}
 */
let uidx = 0;
function uid() {
  return ++uidx;
}

/**
 * @param {Class} cls
 * @param {Function} prot
 */
function inherit(cls, prot) {
  let key = null;
  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  }
}

/**
 * Creates and returns an webgl context
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLRenderingContext}
 */
function getWGLContext(canvas) {
  if (!WGLSupported) {
    throw new Error("Your browser doesn't support WebGL.");
  }
  let opts = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    stencil: false,
    preserveDrawingBuffer: false
  };
  return canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
}

/**
 * Clears the context
 */
function clear() {
  let ctx = this.ctx;
  ctx.clearColor(0, 0, 0, 1);
  ctx.clear(ctx.COLOR_BUFFER_BIT);
  ctx.uniform2f(ctx.getUniformLocation(this.program, "uScale"), this.width, this.height);
}

/**
 * Draws all batched sprites
 */
function draw() {}

/**
 * Change the renderer's rotation
 * @param {Number} x
 */
function rotate(x) {
  this.rotation = x;
}

/**
 * Batch draw a texture
 * @param {Texture} tex
 * @param {Number} sx
 * @param {Number} sy
 * @param {Number} sw
 * @param {Number} sh
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
function drawImage(tex, sx, sy, sw, sh, dx, dy, dw, dh) {

  sx = sx | 0;
  sy = sy | 0;
  sw = sw | 0;
  sh = sh | 0;

  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  let ctx = this.ctx;
  let buffers = this.buffers;
  let program = this.program;

  ctx.uniform2f(ctx.getUniformLocation(program, "uObjScale"), sw, sh);

  let pos = this.vertices.position;
  let rot = this.vertices.rotation;

  let rotation = this.rotation;

  for (let ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = sx + sw / 2;
    pos[2 * ii + 1] = sy + sh / 2;
    /*pos[ii + 0] = dw;
    pos[ii + 4] = dh;
    pos[ii + 6] = dx;
    pos[ii + 7] = dy;*/
    rot[0 + ii] = rotation;
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.bindTexture(ctx.TEXTURE_2D, tex);

  this.setAttribute(buffers.position, "aObjCen", 2, pos);
  this.setAttribute(buffers.rotation, "aObjRot", 1, rot);

  ctx.drawArrays(ctx.TRIANGLES, 0, 6);
}

/**
 * Batch draw a texture
 * @param {Texture} tex
 * @param {Number} sx
 * @param {Number} sy
 * @param {Number} sw
 * @param {Number} sh
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
function drawImage2(tex, sx, sy, sw, sh, dx, dy, dw, dh) {}
//console.log(sx, sy, sw, sh, dx, dy, dw, dh);


/**
 * Resize
 * @param {Number} width
 * @param {Number} height
 */
function resize(width, height) {
  width |= 0;
  height |= 0;
  let ctx = this.ctx;
  let view = this.view;
  this.width = width;
  this.height = height;
  view.width = width;
  view.height = height;
  ctx.useProgram(this.program);
  ctx.viewport(0, 0, width, height);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.BLEND);
  ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
  // immediately redraw, so we get no screen flickering
  this.draw();
}

var _draw = Object.freeze({
  clear: clear,
  draw: draw,
  rotate: rotate,
  drawImage: drawImage,
  drawImage2: drawImage2,
  resize: resize
});

const VERTEX = `
  precision lowp float;
  uniform vec2 uScale;
  uniform vec2 uObjScale;
  attribute vec2 aObjCen;
  attribute float aObjRot;
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
    vec2 pos = vec2(
      aObjCen.x + sin(aObjRot)*uObjScale.y*(-0.5 + uv.y)
      + cos(aObjRot)*uObjScale.x*(-0.5 + uv.x),
      aObjCen.y + cos(aObjRot)*uObjScale.y*(-0.5 + uv.y)
      - sin(aObjRot)*uObjScale.x*(-0.5 + uv.x)
    );
    gl_Position = vec4(
      -1.0 + 2.0*pos.x/uScale.x,
      1.0 - 2.0*pos.y/uScale.y,
      0.0, 1.0
    );
  }
`;

const FRAGMENT = `
  precision lowp float;
  uniform sampler2D uSampler;
  varying vec2 uv;
  void main(void) {
    gl_FragColor = texture2D(uSampler, uv);
    if (gl_FragColor.a < 0.5) discard;
  }
`;

/**
 * Eat passed constructor options
 * @param {Object} obj
 */
function setup(obj) {
  if (!obj) {
    throw new Error("No options specified, require at least an view.");
  }
  // accept passed in view, dont do anything afterwards
  if (obj instanceof HTMLCanvasElement) {
    this.applyView(obj);
    this.finalizeSetup();
    return void 0;
  }
  obj = obj || {};
  // make sure we get an view
  if (!obj.view) {
    throw new Error("No view specified.");
  }
  // make sure view has proper type
  else if (!(obj.view instanceof HTMLElement) && !(obj.view instanceof HTMLCanvasElement)) {
      throw new Error("Received invalid view.");
    }
    // apply the view
    else {
        this.applyView(obj.view);
      }
  // setup width
  if (obj.width >= 0) {
    this.width = obj.width;
  }
  // setup height
  if (obj.height >= 0) {
    this.height = obj.height;
  }
  // setup custom max sprite amount
  if (obj.maximum >= 0) {
    this.maximum = obj.maximum;
  }
  // setup clear color
  if (obj.colors && obj.colors instanceof Array) {
    if (obj.colors.length === 4) {
      this.colors = obj.colors;
    } else {
      throw new Error("Received invalid clear color values.");
    }
  }
  // optional image smoothing state
  this.imageSmoothingEnabled = obj.imageSmoothingEnabled === true;
  this.finalizeSetup();
}

function finalizeSetup() {
  // set context's image smoothing
  this.applyImageSmoothing(this.imageSmoothingEnabled);
  this.buildShaders();
  this.resize(this.width, this.height);
}

/**
 * Apply view on instance
 * @param {HTMLCanvasElement} canvas
 */
function applyView(canvas) {
  this.view = canvas;
  this.ctx = getWGLContext(this.view);
}

/**
 * Apply image smoothing state on ctx
 * @param {Boolean} state
 */
function applyImageSmoothing(state) {
  let ctx = this.ctx;
  ctx.imageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.mozImageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
}

/**
 * Build da shaders
 */
function buildShaders() {

  let ctx = this.ctx;

  let vshader = ctx.createShader(ctx.VERTEX_SHADER);
  let fshader = ctx.createShader(ctx.FRAGMENT_SHADER);

  let size = this.maximum;

  this.compileShader(vshader, VERTEX);
  this.compileShader(fshader, FRAGMENT);

  this.program = ctx.createProgram();

  ctx.attachShader(this.program, vshader);
  ctx.attachShader(this.program, fshader);

  ctx.linkProgram(this.program);

  let buffers = this.buffers;
  let vertices = this.vertices;

  let idxs = vertices.idx = new Float32Array(size * 6);
  let rotations = vertices.rotation = new Float32Array(size * 6);
  let positions = vertices.position = new Float32Array(size * 12);

  buffers.idx = ctx.createBuffer();
  buffers.position = ctx.createBuffer();
  buffers.rotation = ctx.createBuffer();

  for (let ii = 0; ii < size; ii++) {
    idxs[6 * ii + 0] = 0;
    idxs[6 * ii + 1] = 1;
    idxs[6 * ii + 2] = 2;
    idxs[6 * ii + 3] = 1;
    idxs[6 * ii + 4] = 2;
    idxs[6 * ii + 5] = 3;
  }

  this.setAttribute(buffers.idx, "aIdx", 1, idxs);

  ctx.useProgram(this.program);
}

function compileShader(shader, shader_src) {
  let ctx = this.ctx;
  ctx.shaderSource(shader, shader_src);
  ctx.compileShader(shader);
}

function setAttribute(buffer, name, size, values) {
  let ctx = this.ctx;
  let program = this.program;
  let attribute = ctx.getAttribLocation(program, name);
  ctx.enableVertexAttribArray(attribute);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    ctx.bufferData(ctx.ARRAY_BUFFER, values, ctx.DYNAMIC_DRAW);
  }
  ctx.vertexAttribPointer(attribute, size, ctx.FLOAT, false, 0, 0);
}

var _setup = Object.freeze({
  setup: setup,
  finalizeSetup: finalizeSetup,
  applyView: applyView,
  applyImageSmoothing: applyImageSmoothing,
  buildShaders: buildShaders,
  compileShader: compileShader,
  setAttribute: setAttribute
});

/**
 * Buffer textures
 * @param {Array} sprites
 */
function bufferTextures(sprites) {
  for (let key in sprites) {
    let texture = this.bufferTexture(sprites[key]);
    this.texture_pool[key] = texture;
  }
}

/**
 * Create texture buffer from an image
 * @param {HTMLImageElement} image
 * @return {WebGLTexture}
 */
function bufferTexture(image) {
  let ctx = this.ctx;
  let texture = ctx.createTexture();
  ctx.bindTexture(ctx.TEXTURE_2D, texture);
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
  // consider image smoothing state
  if (this.imageSmoothingEnabled) {
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
  } else {
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
  }
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
  return texture;
}

var _buffer = Object.freeze({
  bufferTextures: bufferTextures,
  bufferTexture: bufferTexture
});

const POOL = {
  IMAGES: {},
  TEXTURES: {}
};

function loadImage(path, resolve) {
  let img = new Image();
  img.onload = () => {
    resolve(img);
  };
  img.src = path;
}

function addSprites(items, resolve) {
  let idx = 0;
  let sprites = [];
  items.map(item => {
    this.loadImage(item, img => {
      let id = uid();
      POOL.IMAGES[id] = {
        image: img,
        texture: this.bufferTexture(img)
      };
      POOL.IMAGES[item] = id;
      sprites.push(POOL.IMAGES[id]);
      if (++idx >= items.length) resolve(sprites);
    });
  });
}

var _loader = Object.freeze({
  loadImage: loadImage,
  addSprites: addSprites
});

/**
 * @class WGLRenderer
 */
class WGLRenderer {
  /**
   * @param {Object} opts
   * @constructor
   */
  constructor(opts) {
    /**
     * View to render on
     * @type {HTMLCanvasElement}
     */
    this.view = null;
    /**
     * Wgl context
     * @type {WebGLRenderingContext}
     */
    this.ctx = null;
    /**
     * Clear colors
     * @type {Array}
     */
    this.colors = [0, 0, 0, 1];
    /**
     * View width
     * @type {Number}
     */
    this.width = DEFAULT_WIDTH;
    /**
     * View height
     * @type {Number}
     */
    this.height = DEFAULT_HEIGHT;
    /**
     * Rotation
     * @type {Number}
     */
    this.rotation = 0;
    /**
     * Maximum sprites to handle
     * @type {Number}
     */
    this.maximum = DEFAULT_MAX_SPRITES;
    /**
     * Vertices
     * @type {Object}
     */
    this.vertices = {
      idx: null,
      position: null,
      rotation: null
    };
    /**
     * Buffers
     * @type {Object}
     */
    this.buffers = {
      idxs: null,
      position: null,
      rotation: null
    };
    /**
     * Image smoothing state
     * @type {Boolean}
     */
    this.imageSmoothingEnabled = DEFAULT_IMAGE_SMOOTHING;
    // auto apply passed in options
    this.setup(opts);
  }
}

inherit(WGLRenderer, _draw);
inherit(WGLRenderer, _setup);
inherit(WGLRenderer, _buffer);
inherit(WGLRenderer, _loader);

window.WGLRenderer = WGLRenderer;

},{}]},{},[1]);
