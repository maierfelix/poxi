/**
 * @class Texture
 */
class Texture {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} x
   * @param {Number} y
   */
  constructor(ctx, x, y) {
    this.x = x;
    this.y = y;
    let view = ctx.canvas;
    this.view = view;
    this.width = view.width;
    this.height = view.height;
    this.context = ctx;
    this.data = ctx.getImageData(0, 0, view.width, view.height).data;
  }
};

export default Texture;
