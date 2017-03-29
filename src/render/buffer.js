/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {Uint8Array} data
 * @param {Number} width
 * @param {Number} height
 * @return {WebGLTexture}
 */
export function bufferTexture(name, data, width, height) {
  const gl = this.gl;
  const texture = gl.createTexture();
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
};

/**
 * Lookup for the texture inside our texture pool and free it from memory
 * @param {WebGLTexture} texture
 */
export function destroyTexture(texture) {
  const gl = this.gl;
  const textures = this.cache.gl.textures;
  for (let key in textures) {
    let txt = textures[key];
    if (txt !== texture) continue;
    gl.deleteTexture(txt);
    delete textures[key];
    txt = null;
    break;
  };
};

/**
 * @param {WebGLTexture} texture
 * @param {Uint8Array} data
 * @param {Number} width
 * @param {Number} height
 */
export function updateTexture(texture, data, width, height) {
  const gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.bindTexture(gl.TEXTURE_2D, null);
};
