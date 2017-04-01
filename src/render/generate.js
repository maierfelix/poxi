import {
  TILE_SIZE,
  HIDE_GRID,
  MAGIC_SCALE,
  GRID_LINE_WIDTH
} from "../cfg";

import {
  createCanvasBuffer,
  applyImageSmoothing
} from "../utils";

/**
 * @return {CanvasRenderingContext2D}
 */
export function createGridBuffer() {
  const cw = this.cw;
  const ch = this.ch;
  const buffer = createCanvasBuffer(cw, ch);
  if (this.cache.grid !== null) {
    this.cache.grid = null;
    this.destroyTexture(this.cache.gridTexture);
  }
  this.cache.grid = buffer;
  this.cache.gridTexture = this.bufferTexture("grid", buffer.canvas);
  this.redrawGridBuffer();
  return (buffer);
};

/**
 * TODO: use imagedata and draw the grid onto
 * @return {Void}
 */
export function redrawGridBuffer() {
  if (this.cr <= HIDE_GRID) return;
  return;
  const buffer = this.cache.grid;
  const texture = this.cache.gridTexture;
  const cr = this.cr;
  const size = (TILE_SIZE * cr) | 0;
  const cx = this.cx;
  const cy = this.cy;
  const cw = this.cw;
  const ch = this.ch;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (let xx = (cx % size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  };
  for (let yy = (cy % size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  };
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.updateTexture(texture, buffer.getImageData(0, 0, cw, ch));
  this.last.cx = this.cx;
  this.last.cy = this.cy;
  return;
};

/**
 * @return {WebGLTexture}
 */
export function createBackgroundBuffer() {
  if (this.cache.bg instanceof WebGLTexture) {
    this.destroyTexture(this.cache.bg);
  }
  const size = TILE_SIZE;
  const cw = this.cw;
  const ch = this.ch;
  const canvas = document.createElement("canvas");
  const buffer = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  buffer.fillStyle = "#1f1f1f";
  buffer.fillRect(0, 0, cw, ch);
  // bright rectangles
  buffer.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      buffer.fillRect(xx, yy, size, size);
      buffer.fillRect(xx, yy, size, size);
    };
  };
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      buffer.fillRect(xx, yy, size, size);
    };
  };
  const texture = this.bufferTexture("background", canvas);
  return (texture);
};

/**
 * @return {CanvasRenderingContext2D}
 */
export function createForegroundBuffer() {
  const cw = this.cw;
  const ch = this.ch;
  const buffer = createCanvasBuffer(cw, ch);
  applyImageSmoothing(buffer, true);
  if (this.cache.fg !== null) {
    this.cache.fg = null;
    this.destroyTexture(this.cache.fgTexture);
  }
  this.cache.fg = buffer;
  this.cache.fgTexture = this.bufferTexture("foreground", buffer.canvas);
  return (buffer);
};
