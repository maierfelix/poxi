/**
 * Clears the context
 */
export function clear() {
  const gl = this.gl;
  gl.clearColor(0, 0, 0, 1);
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
  };

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  this.setGlAttribute(program, this.cache.gl.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

};

/**
 * Draw a rectangle
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dw
 * @param {Number} dh
 * @param {Array} color
 */
export function drawRectangle(dx, dy, dw, dh, color) {
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
  };

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.cache.gl.empty);
  gl.uniform4f(
    gl.getUniformLocation(program, "vColor"),
    color[0], color[1], color[2], color[3]
  );
  this.setGlAttribute(program, this.cache.gl.buffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.uniform1i(gl.getUniformLocation(program, "isRect"), 0);

};
