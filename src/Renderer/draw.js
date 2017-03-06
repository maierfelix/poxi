/**
 * Clears the context
 */
export function clear() {
  let gl = this.ctx;
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
};

/**
 * Draw a texture
 * @param {Texture} tex
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
export function drawImage(tex, dx, dy, dw, dh) {
  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  let gl = this.ctx;
  let program = this.psprite;

  gl.uniform2f(
    gl.getUniformLocation(program, "uScale"),
    this.width, this.height
  );
  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );

  let pos = this.vertices.position;
  for (let ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  };

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  this.setAttribute(program, this.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

};

/**
 * Draw a rectangle
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 */
export function drawRectangle(dx, dy, dw, dh) {
  dx = dx | 0;
  dy = dy | 0;
  dw = dw | 0;
  dh = dh | 0;

  let gl = this.ctx;
  let buffers = this.buffers;
  let program = this.psprite;

  gl.uniform2f(
    gl.getUniformLocation(program, "uScale"),
    this.width, this.height
  );
  gl.uniform2f(
    gl.getUniformLocation(program, "uObjScale"),
    dw, dh
  );

  gl.uniform1i(gl.getUniformLocation(program, "isRectangle"), 1);
  gl.uniform4f(
    gl.getUniformLocation(program, "rectColor"),
    1, 0.5, 0, 1
  );

  let pos = this.vertices.position;
  for (let ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = dx + (dw / 2);
    pos[2 * ii + 1] = dy + (dh / 2);
  };

  gl.activeTexture(gl.TEXTURE0);
  this.setAttribute(program, this.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

};

/**
 * Resize
 */
export function resize() {
  let width = this.camera.width;
  let height = this.camera.height;
  let gl = this.ctx;
  let view = this.view;
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
};
