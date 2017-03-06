/**
 * Create texture buffer from canvas
 * @param {String} name
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLTexture}
 */
export function bufferTexture(name, canvas) {
  let ctx = this.ctx;
  let texture = ctx.createTexture();
  ctx.bindTexture(ctx.TEXTURE_2D, texture);
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, canvas);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
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
