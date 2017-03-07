import { getWGLContext } from "../utils";
import { WGL_TEXTURE_LIMIT } from "../cfg";

import {
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
  gl.disable(gl.BLEND);
  this.ctx = gl;
  this.buildShaders();
  this.empty = this.createEmptyTexture();
  this.resize();
};

export function buildShaders() {
  this.psprite = this.createSpriteProgram();
};

/**
 * @return {WebGLTexture}
 */
export function createEmptyTexture() {
  let gl = this.ctx;
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0])
  );
  return (texture);
};

/**
 * @return {WebGLProgram}
 */
export function createSpriteProgram() {
  let gl = this.ctx;
  let size = WGL_TEXTURE_LIMIT;
  let program = gl.createProgram();
  let vshader = gl.createShader(gl.VERTEX_SHADER);
  let fshader = gl.createShader(gl.FRAGMENT_SHADER);

  this.compileShader(vshader, SPRITE_VERTEX);
  this.compileShader(fshader, SPRITE_FRAGMENT);

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);

  let buffers = this.buffers;
  let vertices = this.vertices;
  let idxs = vertices.idx = new Float32Array(size * 6);
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
  };

  this.setAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return (program);
};

export function compileShader(shader, shader_src) {
  let gl = this.ctx;
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
};

export function setAttribute(program, buffer, name, size, values) {
  let gl = this.ctx;
  let attribute = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);
  }
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
};
