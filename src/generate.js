import { TILE_SIZE } from "./cfg";
import { createCanvasBuffer } from "./utils";

export function generateHoveredTile() {
  let ww = TILE_SIZE;
  let hh = TILE_SIZE;
  let buffer = createCanvasBuffer(ww, hh);
  buffer.fillStyle = `rgba(255, 255, 255, 0.2)`;
  buffer.fillRect(0, 0, ww, hh);
  let texture = this.renderer.bufferTexture("hover", buffer.canvas);
  return (texture);
};

export function generateBackground() {
  if (this.bg instanceof WebGLTexture) {
    this.renderer.destroyTexture(this.bg);
  }
  let size = 8;
  let cw = this.width;
  let ch = this.height;
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);
  // bright rectangles
  ctx.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    };
  };
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
    };
  };
  let texture = this.renderer.bufferTexture("background", canvas);
  this.bg = texture;
};
