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
  this.clear();
  this.render();
};

export function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

export function render() {
  this.renderGrid();
  this.renderTiles();
  this.renderFPS();
};

export function renderFPS() {
  let now = Date.now();
  let delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
};

export function renderTiles() {
  let ctx = this.ctx;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let scale = this.camera.s;
  let batches = this.editor.batches.tiles;
  // all tile batch operations
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    // process each batched tiles
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      let x = (cx + (tile.x * scale))|0;
      let y = (cy + (tile.y * scale))|0;
      let ww = (8*scale)|0;
      let hh = (8*scale)|0;
      let color = tile.colors[tile.cindex];
      let r = color[0];
      let g = color[1];
      let b = color[2];
      let a = color[3];
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(x, y, ww, hh);
    };
  };
};

export function renderGrid() {

  let ctx = this.ctx;
  let size = 8 * this.camera.s;

  let cx = this.camera.x;
  let cy = this.camera.y;
  let cw = this.camera.width;
  let ch = this.camera.height;

  ctx.lineWidth = .25;

  ctx.strokeStyle = "#8a8a8a";

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