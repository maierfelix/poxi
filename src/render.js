import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE
} from "./cfg";

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
  this.generateBackground();
  this.clear();
  this.render();
};

export function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

export function render() {
  this.renderBackground();
  this.renderTiles();
  if (this.camera.s > MIN_SCALE) {
    this.renderGrid();
  }
  this.renderFPS();
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

export function renderTiles() {
  let ctx = this.ctx;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let scale = this.camera.s;
  let ww = (TILE_SIZE*scale)|0;
  let hh = (TILE_SIZE*scale)|0;
  let selectAll = this.editor.modes.selectAll;
  let batches = this.editor.batches.tiles;
  // all tile batch operations
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    // process each batched tiles
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      let x = (cx + (tile.x * scale))|0;
      let y = (cy + (tile.y * scale))|0;
      let color = tile.colors[tile.cindex];
      let r = color[0];
      let g = color[1];
      let b = color[2];
      let a = color[3];
      // apply selection effect
      if (selectAll) a = 0.1;
      else if (tile.isHovered) a /= 1.5;
      if (this.editor.isTileInsideView(tile)) {
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(x, y, ww, hh);
      }
    };
  };
};

export function renderFPS() {
  let now = Date.now();
  let delta = now - this.last;
  this.last = now;
  this.ctx.fillStyle = "#fff";
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
};

/**
 * Background grid as transparency placeholder
 */
export function generateBackground() {

  let size = 8;

  let cw = this.camera.width;
  let ch = this.camera.height;

  let buffer = this.createCanvasBuffer(cw, ch);

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