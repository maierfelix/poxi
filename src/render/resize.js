/**
 * Resize
 * @param {Number} width
 * @param {Number} height
 */
export function resize(width, height) {
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
  // re-generate our bg and fg
  this.cache.bg = this.createBackgroundBuffer();
  this.cache.fg = this.createForegroundBuffer();
  // re-generate our grid
  this.cache.grid = this.createGridBuffer();
  this.redrawGridBuffer();
};
