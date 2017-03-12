import { getWGLContext } from "../utils";
import { WGL_TEXTURE_LIMIT } from "../cfg";

import {
  SPRITE_VERTEX,
  SPRITE_FRAGMENT
} from "./shaders";

/**
 * @param {HTMLCanvasElement} view 
 */
export function setupRenderer(view) {
  this.view = view;
  this.gl = getWGLContext(view);
  this.program = this.createSpriteProgram();
  this.gl.useProgram(this.program);
  this.cache.gl.empty = this.createEmptyTexture();
};

/**
 * @return {WebGLTexture}
 */
export function createEmptyTexture() {
  const gl = this.gl;
  const texture = gl.createTexture();
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
  };

  this.setGlAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return (program);
};

export function compileShader(shader, shader_src) {
  const gl = this.gl;
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);
};

export function setGlAttribute(program, buffer, name, size, values) {
  const gl = this.gl;
  const attribute = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (values.length > 0) {
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);
  }
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
};
