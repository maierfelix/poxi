import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  HIDE_GRID
} from "./cfg";

import {
  createCanvasBuffer,
  applyImageSmoothing
} from "./utils";

/**
 * @param {Number} width
 * @param {Number} height
 */
export function resize(width, height) {
  if (width >= 0) this.width = width;
  if (height >= 0) this.height = height;
  this.view.width = width;
  this.view.height = height;
  applyImageSmoothing(this.ctx, false);
  this.camera.resize(width, height);
  // re-generate our bg
  this.generateBackground();
  this.clear();
  this.render();
};

export function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

export function render() {
  this.renderBackground();
  this.renderTileBatches();
  if (this.camera.s > (MIN_SCALE + HIDE_GRID)) {
    this.renderGrid();
  }
  this.renderStats();
};

export function renderBackground() {
  let width = this.camera.width
  let height = this.camera.height;
  this.ctx.drawImage(
    this.bg,
    0, 0,
    width, height,
    0, 0,
    width, height
  );
};

export function renderGrid() {
  let ctx = this.ctx;
  let size = (TILE_SIZE*this.camera.s)|0;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let cw = this.camera.width;
  let ch = this.camera.height;
  ctx.lineWidth = .25;
  ctx.strokeStyle = "rgba(51,51,51,0.75)";
  ctx.beginPath();
  for (let xx = (cx%size)|0; xx < cw; xx += size) {
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, ch);
  };
  for (let yy = (cy%size)|0; yy < ch; yy += size) {
    ctx.moveTo(0, yy);
    ctx.lineTo(cw, yy);
  };
  ctx.stroke();
  ctx.closePath();
};

export function renderTileBatches() {
  let ctx = this.ctx;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let scale = this.camera.s;
  let ww = (TILE_SIZE*scale)|0;
  let hh = (TILE_SIZE*scale)|0;
  let all = this.editor.modes.selectAll;

  let batches = this.editor.batches;
  let length = batches.length;

  // all tile batch operations
  for (let ii = 0; ii < length; ++ii) {
    let batch = batches[ii];
    // draw batch buffer (faster)
    if (!(batch.isBuffered)) continue;
    let bx = batch.buffer.x * TILE_SIZE;
    let by = batch.buffer.y * TILE_SIZE;
    let x = (cx + (bx * scale)) | 0;
    let y = (cy + (by * scale)) | 0;
    let width = batch.buffer.width * TILE_SIZE;
    let height = batch.buffer.height * TILE_SIZE;
    ctx.drawImage(
      batch.buffer.view,
      0, 0,
      width | 0, height | 0,
      x, y,
      (width * TILE_SIZE * scale) | 0, (height * TILE_SIZE * scale) | 0
    );
  };

  // draw each tile (e.g. when in drawing state, slower)
  for (let ii = 0; ii < length; ++ii) {
    let batch = batches[ii];
    if (batch.isBuffered) continue;
    let tiles = batch.tiles;
    for (let jj = 0; jj < tiles.length; ++jj) {
      let tile = tiles[jj];
      if (!this.editor.isTileInsideView(tile)) continue;
      let x = (cx + (tile.x * scale)) | 0;
      let y = (cy + (tile.y * scale)) | 0;
      let color = tile.colors[tile.cindex];
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
      ctx.fillRect(x, y, ww, hh);
    };
  };

  // draw hovered tile
  let hovered = this.editor.hovered;
  for (let ii = 0; ii < hovered.length; ++ii) {
    let tile = hovered[ii];
    let x = (cx + (tile.x * scale)) | 0;
    let y = (cy + (tile.y * scale)) | 0;
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3] / 1.5;
    ctx.clearRect(x, y, ww, hh);
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(x, y, ww, hh);
  };

  // apply empty tile hover color
  if (!hovered.length) {
    let mx = this.editor.mx;
    let my = this.editor.my;
    let relative = this.editor.getRelativeOffset(mx, my);
    let rx = relative.x;
    let ry = relative.y;
    let x = (cx + (rx * scale)) | 0;
    let y = (cy + (ry * scale)) | 0;
    ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.fillRect(x, y, ww, hh);
  }

};

export function renderStats() {
  this.ctx.fillStyle = "#ffffff";
  // render mouse hovered color
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x;
  let ry = relative.y;
  let tile = this.editor.getTileByPosition(rx, ry);
  this.ctx.fillText(`x:${rx}, y:${ry}`, 16, 32);
  if (tile !== null) {
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    this.ctx.fillText(`${r},${g},${b},${a}`, 16, 48);
  }
  this.renderFPS();
};

export function renderFPS() {
  let now = Date.now();
  let delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
};

/**
 * Background grid as transparency placeholder
 */
export function generateBackground() {

  let size = 8;

  let cw = this.width;
  let ch = this.height;

  let buffer = createCanvasBuffer(cw, ch);

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  canvas.width = cw;
  canvas.height = ch;

  this.bg = canvas;

  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);

  // bright rectangles
  ctx.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    };
  };
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
    };
  };

};