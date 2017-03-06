import {
  TILE_SIZE,
  MAGIC_SCALE,
  GRID_LINE_WIDTH
} from "./cfg";

import { createCanvasBuffer } from "./utils";
import { roundTo } from "./math";

export function generateHoveredTile() {
  let ww = TILE_SIZE;
  let hh = TILE_SIZE;
  let buffer = createCanvasBuffer(ww, hh);
  buffer.fillStyle = `rgba(255, 255, 255, 0.2)`;
  buffer.fillRect(0, 0, ww, hh);
  let texture = this.renderer.bufferTexture("hover", buffer.canvas, false);
  return (texture);
};

/**
 * @return {CanvasRenderingContext2D}
 */
export function createGridBuffer() {
  let cw = this.camera.width;
  let ch = this.camera.height;
  let buffer = createCanvasBuffer(cw, ch);
  if (this.grid !== null) {
    this.grid = null;
    this.renderer.destroyTexture(this.gridTexture);
  }
  this.grid = buffer;
  this.gridTexture = this.renderer.bufferTexture("grid", buffer.canvas, true);
  this.redrawGridBuffer();
  return (buffer);
};

export function redrawGridBuffer() {
  let buffer = this.grid;
  let texture = this.gridTexture;
  let cs = roundTo(this.camera.s, MAGIC_SCALE);
  let size = (TILE_SIZE * this.camera.s) | 0;
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cw = this.camera.width;
  let ch = this.camera.height;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (let xx = (cx%size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  };
  for (let yy = (cy%size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  };
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.renderer.updateTexture(texture, buffer.canvas);
};

/**
 * @return {WebGLTexture}
 */
export function createBackgroundBuffer() {
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
  let texture = this.renderer.bufferTexture("background", canvas, false);
  return (texture);
};
