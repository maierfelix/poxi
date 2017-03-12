import {
  TILE_SIZE,
  MAGIC_SCALE,
  GRID_LINE_WIDTH,
  SELECTION_COLOR,
  TILE_HOVER_COLOR
} from "../cfg";

import { roundTo } from "../math";

export function redraw() {
  // only redraw texture if it's absolutely necessary
  if (this.lcx !== this.cx || this.lcy !== this.cy) {
    this.redrawGridBuffer();
  }
  this.clear();
  this.render();
};

/** Main render method */
export function render() {
  const selection = this.sw !== -0 && this.sh !== -0;
  this.renderBackground();
  this.renderGrid();
  this.renderLayers();
  if (!this.states.select || !selection) {
    this.renderHoveredTile();
  }
  if (selection) this.renderSelection();
};

export function renderBackground() {
  this.drawImage(
    this.cache.bg,
    0, 0,
    this.cw, this.ch
  );
};

export function renderGrid() {
  this.drawImage(
    this.cache.gridTexture,
    0, 0,
    this.cw, this.ch
  );
};

/** Render all layers */
export function renderLayers() {
  const cx = this.cx;
  const cy = this.cy;
  const cr = this.cr;
  const layers = this.layers;
  for (let ii = 0; ii < this.layers.length; ++ii) {
    const layer = layers[ii];
    if (layer.states.hidden) continue;
    if (!this.boundsInsideView(layer.bounds)) continue;
    const bounds = layer.bounds;
    const x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [255, 0, 0, 0.2]
    );
    this.renderLayer(layer);
  };
};

/**
 * @param {Layer} layer
 */
export function renderLayer(layer) {
  const cx = this.cx;
  const cy = this.cy;
  const cr = this.cr;
  const lx = layer.x * TILE_SIZE;
  const ly = layer.y * TILE_SIZE;
  const batches = layer.batches;
  const opacity = layer.opacity;
  // reset renderer opacity into original state
  const oopacity = opacity;
  if (opacity !== 255.0) this.setOpacity(opacity);
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    // batch is a background, fill the whole screen
    if (batch.isBackground) {
      this.drawRectangle(
        0, 0,
        this.cw, this.ch,
        batch.color
      );
      continue;
    }
    // draw batch boundings
    const x = (cx + (lx + (bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + (lx + (bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [0, 0, 255, 0.2]
    );
    continue;
    this.drawImage(
      batch.texture,
      xx, yy
    );
  };
  if (opacity !== 255.0) this.setOpacity(oopacity);
};

export function renderHoveredTile() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  // apply empty tile hover color
  const mx = this.mx;
  const my = this.my;
  const relative = this.getRelativeTileOffset(mx, my);
  //console.log(relative.x, relative.y);
  const rx = relative.x * TILE_SIZE;
  const ry = relative.y * TILE_SIZE;
  const x = ((cx + GRID_LINE_WIDTH/2) + (rx * cr)) | 0;
  const y = ((cy + GRID_LINE_WIDTH/2) + (ry * cr)) | 0;
  const ww = (TILE_SIZE * cr) | 0;
  const hh = (TILE_SIZE * cr) | 0;
  this.drawRectangle(
    x, y,
    ww, hh,
    TILE_HOVER_COLOR
  );
};

export function renderSelection() {
  const cr = this.cr;
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const xx = (cx + (this.sx * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.sy * TILE_SIZE) * cr) | 0;
  const ww = ((this.sw * TILE_SIZE) * cr) | 0;
  const hh = ((this.sh * TILE_SIZE) * cr) | 0;
  this.drawRectangle(
    xx, yy,
    ww, hh,
    SELECTION_COLOR
  );
};
