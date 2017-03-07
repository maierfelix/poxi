import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  HIDE_GRID,
  MAGIC_SCALE,
  GRID_LINE_WIDTH
} from "./cfg";

import {
  createCanvasBuffer,
  applyImageSmoothing
} from "./utils";

import { roundTo } from "./math";

/**
 * @param {Number} width
 * @param {Number} height
 */
export function resize(width, height) {
  if (width >= 0) this.width = width;
  if (height >= 0) this.height = height;
  this.view.width = width;
  this.view.height = height;
  this.camera.resize(width, height);
  // re-generate our bg
  this.bg = this.createBackgroundBuffer();
  // generate our grid
  this.grid = this.createGridBuffer();
  // re-generate background batches
  this.editor.resizeBackgroundBatches(width, height);
  this.renderer.resize();
  this.redraw();
};

export function redraw() {
  if (this.showGrid()) {
    this.redrawGridBuffer();
  }
  this.clear();
  this.render();
};

export function clear() {
  this.renderer.clear();
};

export function render() {
  this.renderer.ctx.useProgram(this.renderer.psprite);
  this.renderer.updateViewport();
  this.renderBackground();
  if (this.showGrid()) this.renderGrid();
  this.renderBatches();
  this.drawHoveredTile();
  //this.renderStats();
};

export function renderBackground() {
  let width = this.camera.width
  let height = this.camera.height;
  this.renderer.drawImage(
    this.bg,
    0, 0,
    width, height
  );
};

export function renderGrid() {
  let width = this.camera.width
  let height = this.camera.height;
  this.renderer.drawImage(
    this.gridTexture,
    0, 0,
    width, height
  );
};

export function renderBatches() {
  let sindex = this.editor.sindex;
  let batches = this.editor.stack;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii].batch;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - ii < 0) continue;
    if (!this.editor.isBatchInsideView(batch)) continue;
    if (batch.isBackground) this.drawBackgroundBatch(batch);
    // draw batched buffer (faster, drawImage)
    else if (batch.isBuffered) this.drawBatchedBuffer(batch);
    // draw batched tiles (slower, fillRect)
    else this.drawBatchedTiles(batch);
  };
  // draw currently drawn tiles
  if (this.editor.modes.draw) {
    let length = this.editor.batches.length;
    if (length > 0) this.drawBatchedTiles(this.editor.batches[length - 1]);
  }
};

/**
 * @param {Batch} batch
 */
export function drawBackgroundBatch(batch) {
  let ctx = this.ctx;
  let buffer = batch.bgbuffer;
  let width = buffer.width | 0;
  let height = buffer.height | 0;
  this.renderer.drawImage(
    batch.buffer.texture,
    0, 0,
    width, height
  );
};

/**
 * @param {Batch} batch
 */
export function drawBatchedTiles(batch) {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cs = roundTo(this.camera.s, MAGIC_SCALE);
  let ww = (TILE_SIZE * cs) | 0;
  let hh = (TILE_SIZE * cs) | 0;
  let tiles = batch.tiles;
  for (let jj = 0; jj < tiles.length; ++jj) {
    let tile = tiles[jj];
    let x = ((cx + ((tile.x * TILE_SIZE) * cs))) | 0;
    let y = ((cy + ((tile.y * TILE_SIZE) * cs))) | 0;
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    this.renderer.drawRectangle(x, y, ww, hh, tile.getColorAsRgbaBytes());
  };
};

/**
 * @param {Batch} batch
 */
export function drawBatchedBuffer(batch) {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cs = roundTo(this.camera.s, MAGIC_SCALE);
  let bx = batch.x * TILE_SIZE;
  let by = batch.y * TILE_SIZE;
  let x = (cx + (bx * cs)) | 0;
  let y = (cy + (by * cs)) | 0;
  let ww = ((batch.width * TILE_SIZE) * cs) | 0;
  let hh = ((batch.height * TILE_SIZE) * cs) | 0;
  this.renderer.drawImage(
    batch.buffer.texture,
    x, y,
    ww, hh
  );
};

export function drawHoveredTile() {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cs = roundTo(this.camera.s, MAGIC_SCALE);
  let ww = (TILE_SIZE * cs) | 0;
  let hh = (TILE_SIZE * cs) | 0;
  // apply empty tile hover color
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x * TILE_SIZE;
  let ry = relative.y * TILE_SIZE;
  let x = ((cx + GRID_LINE_WIDTH/2) + (rx * cs)) | 0;
  let y = ((cy + GRID_LINE_WIDTH/2) + (ry * cs)) | 0;
  if (mx !== -0 && my !== -0) {
    this.renderer.drawRectangle(
      x, y,
      ww, hh,
      [255, 255, 255, 0.2]
    );
  }
};

export function renderStats() {
  // render mouse hovered color
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x;
  let ry = relative.y;
  let color = this.editor.getStackRelativeTileColorAt(rx, ry);
  this.ctx.fillStyle = "#ffffff";
  this.ctx.fillText(`x:${rx}, y:${ry}`, 16, 32);
  if (color !== null) {
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    this.ctx.fillRect(
      6, 42, 8, 8
    );
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(`${r},${g},${b},${a}`, 20, 48);
  }
  this.renderFPS();
};

export function renderFPS() {
  let now = Date.now();
  let delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
};
