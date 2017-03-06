import { getWGLContext } from "../utils";
import { WGL_TEXTURE_LIMIT } from "../cfg";

import {
  GRID_VERTEX,
  GRID_FRAGMENT,
  SPRITE_VERTEX,
  SPRITE_FRAGMENT
} from "./shaders";

/**
 * @param {HTMLCanvasElement} view 
 */
export function setup(view) {
  this.view = view;
  let gl = getWGLContext(this.view);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  this.ctx = gl;
  this.buildShaders();
  this.resize();
};

/**
 * Build da shaders
 */
export function buildShaders() {
  this.psprite = this.createSpriteProgram();
};

export function createSpriteProgram() {
  let ctx = this.ctx;
  let size = WGL_TEXTURE_LIMIT;
  let program = ctx.createProgram();
  let vshader = ctx.createShader(ctx.VERTEX_SHADER);
  let fshader = ctx.createShader(ctx.FRAGMENT_SHADER);

  this.compileShader(vshader, SPRITE_VERTEX);
  this.compileShader(fshader, SPRITE_FRAGMENT);

  ctx.attachShader(program, vshader);
  ctx.attachShader(program, fshader);
  ctx.linkProgram(program);

  let buffers = this.buffers;
  let vertices = this.vertices;
  let idxs = vertices.idx = new Float32Array(size * 6);
  vertices.position = new Float32Array(size * 12);

  buffers.idx = ctx.createBuffer();
  buffers.position = ctx.createBuffer();
  for (let ii = 0; ii < size; ii++) {
    idxs[6 * ii + 0] = 0;
    idxs[6 * ii + 1] = 1;
    idxs[6 * ii + 2] = 2;
    idxs[6 * ii + 3] = 1;
    idxs[6 * ii + 4] = 2;
    idxs[6 * ii + 5] = 3;
  };

  this.setAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return (program);
};

export function compileShader(shader, shader_src) {
  let ctx = this.ctx;
  ctx.shaderSource(shader, shader_src);
  ctx.compileShader(shader);
};

export function setAttribute(program, buffer, name, size, values) {
  let ctx = this.ctx;
  let attribute = ctx.getAttribLocation(program, name);
  ctx.enableVertexAttribArray(attribute);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    ctx.bufferData(ctx.ARRAY_BUFFER, values, ctx.DYNAMIC_DRAW);
  }
  ctx.vertexAttribPointer(attribute, size, ctx.FLOAT, false, 0, 0);
};
