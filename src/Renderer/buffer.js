/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @param {Boolean} linear
 * @return {WebGLTexture}
 */
export function bufferTexture(name, canvas, linear) {
  let gl = this.ctx;
  let texture = gl.createTexture();
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
  if (this.textures[name] === void 0) {
    this.textures[name] = texture;
  }
  return (this.textures[name]);
};

/**
 * Lookup for the texture inside our texture pool and free it from memory
 * @param {WebGLTexture} texture
 */
export function destroyTexture(texture) {
  let gl = this.ctx;
  let textures = this.textures;
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
 * @param {HTMLCanvasElement} canvas 
 */
export function updateTexture(texture, canvas) {
  let gl = this.ctx;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
};
