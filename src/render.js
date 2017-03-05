import {
  TILE_SIZE,
  MIN_SCALE,
  HIDE_GRID,
  GRID_LINE_WIDTH
} from "./cfg";

import { rgbaToHex } from "./utils";
import { roundTo } from "./math";

/**
 * @param {Number} width
 * @param {Number} height
 */
export function resize(width, height) {
  if (width >= 0) this.width = width;
  if (height >= 0) this.height = height;
  this.renderer.resize(width, height);
  this.camera.resize(width, height);
  // re-generate our bg
  this.generateBackground();
  // re-generate background batches
  this.editor.resizeBackgroundBatches(width, height);
  this.clear();
  this.render();
};

export function clear() {
  let stage = this.stage;
  while (stage.children.length > 0) {
    stage.removeChild(stage.children[0]);
  };
};

export function render() {
  this.renderBackground();
  this.renderBatches();
  if (this.camera.s > (MIN_SCALE + HIDE_GRID)) {
    //this.renderGrid();
  }
  this.drawHoveredTile();
  this.drawActiveCursor();
  //this.renderStats();
  this.renderer.render(this.stage);
};

export function renderBackground() {
  let width = this.camera.width
  let height = this.camera.height;
  this.stage.addChild(this.bg);
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
 * @return {Void}
 */
export function drawActiveCursor() {
  if (!this.cursor) return; // no cursor available
  let view = this.cursors[this.cursor];
  if (!view) return; // cursor got not loaded yet
  let drawing = this.editor.modes.draw;
  // cursor gets a bit transparent when user is drawing
  view.alpha = drawing ? 0.5 : 1.0;
  let mx = this.editor.mx;
  let my = this.editor.my;
  let w = 1 + (view.texture.width / 6) | 0;
  let h = 1 + (view.texture.height / 6) | 0;
  let x = ((mx + (w / 2))) | 0;
  let y = ((my + (h / 2))) | 0;
  view.position.x = x;
  view.position.y = y;
  view.scale.x = 0.2;
  view.scale.y = 0.2;
  this.stage.addChild(view);
  return;
};

/**
 * @param {Batch} batch
 */
export function drawBackgroundBatch(batch) {
  let ctx = this.ctx;
  let buffer = batch.bgbuffer;
  let width = buffer.width | 0;
  let height = buffer.height | 0;
  ctx.drawImage(
    buffer,
    0, 0,
    width, height,
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
  let cs = roundTo(this.camera.s, 0.125);
  let ww = (TILE_SIZE * cs) | 0;
  let hh = (TILE_SIZE * cs) | 0;
  let ctx = this.ctx;
  let tiles = batch.tiles;
  for (let jj = 0; jj < tiles.length; ++jj) {
    let tile = tiles[jj];
    let x = ((cx + ((tile.x * TILE_SIZE) * cs))) | 0;
    let y = ((cy + ((tile.y * TILE_SIZE) * cs))) | 0;
    let color = rgbaToHex(tile.colors[tile.cindex]);
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    let graphics = new PIXI.Graphics();
    graphics.beginFill(color, 1);
    graphics.drawRect(x, y, ww, hh);
    graphics.endFill();
    this.stage.addChild(graphics);
  };
};

/**
 * @param {Batch} batch
 */
export function drawBatchedBuffer(batch) {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cs = roundTo(this.camera.s, 0.125);
  let bx = batch.x * TILE_SIZE;
  let by = batch.y * TILE_SIZE;
  let x = (cx + (bx * cs)) | 0;
  let y = (cy + (by * cs)) | 0;
  let ww = (TILE_SIZE * cs) | 0;
  let hh = (TILE_SIZE * cs) | 0;
  let entity = batch.buffer.texture;
  entity.position.x = x;
  entity.position.y = y;
  entity.scale.x = ww;
  entity.scale.y = hh;
  this.stage.addChild(entity);
};

export function drawHoveredTile() {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let cs = roundTo(this.camera.s, 0.125);
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x * TILE_SIZE;
  let ry = relative.y * TILE_SIZE;
  let x = (cx + (rx * cs)) | 0;
  let y = (cy + (ry * cs)) | 0;
  let entity = this.hover;
  entity.position.x = x;
  entity.position.y = y;
  entity.scale.x = cs;
  entity.scale.y = cs;
  this.stage.addChild(entity);
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
};
