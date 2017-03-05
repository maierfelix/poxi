import {
  TILE_SIZE,
  GRID_LINE_WIDTH
} from "./cfg";

import { createCanvasBuffer } from "./utils";

/**
 * Generates texture for hovered tile
 */
export function generateHoverTile() {
  let size = TILE_SIZE;
  let buffer = createCanvasBuffer(size, size);
  let view = buffer.canvas;
  buffer.fillStyle = `rgba(255, 255, 255, 0.2)`;
  buffer.fillRect(
    0, 0,
    size, size
  );
  let texture = new PIXI.Sprite(PIXI.Texture.fromCanvas(view));
  this.hover = texture;
};

/**
 * Background grid as transparency placeholder
 */
export function generateBackground() {
  let size = TILE_SIZE;
  let cw = this.width;
  let ch = this.height;
  let ctx = createCanvasBuffer(cw, ch);
  let view = ctx.canvas;
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
  // free old texture from memory
  if (this.bg !== null) {
    this.bg.destroy(true);
    this.bg = null;
  }
  let texture = new PIXI.Sprite(PIXI.Texture.fromCanvas(view));
  this.bg = texture;
};
