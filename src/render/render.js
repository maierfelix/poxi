import {
  MODES,
  TILE_SIZE,
  HIDE_GRID,
  MAGIC_SCALE,
  GRID_LINE_WIDTH,
  SELECTION_COLOR,
  ERASE_TILE_COLOR,
  TILE_HOVER_COLOR,
  SELECTION_COLOR_ACTIVE
} from "../cfg";

import { createCanvasBuffer } from "../utils";
import { colorToRgbaString } from "../color";

export function updateGrid() {
  // only redraw texture if it's absolutely necessary
  if (this.last.cx !== this.cx || this.last.cy !== this.cy) {
    this.redrawGridBuffer();
    this.redraw = true;
  }
};

/**
 * Returns state if we can render
 * a cached version of our view buffer
 * @return {Boolean}
 */
export function canRenderCachedBuffer() {
  return (
    !this.states.drawing &&
    !this.states.erasing &&
    !this.states.arc &&
    !this.states.rect &&
    !this.states.stroke &&
    !this.states.lighting &&
    !this.states.moving
  );
};

/** Main render method */
export function render() {
  const selection = this.sw !== -0 && this.sh !== -0;
  const cr = this.cr;
  this.renderBackground();
  if (this.cr > HIDE_GRID) this.renderGrid();
  // render cached version of our working area
  if (this.canRenderCachedBuffer()) {
    const cx = this.cx | 0;
    const cy = this.cy | 0;
    const layers = this.layers;
    for (let ii = 0; ii < layers.length; ++ii) {
      const layer = layers[ii];
      if (layer.hidden) continue;
      const bounds = layer.bounds;
      const ww = (bounds.w * TILE_SIZE) * cr;
      const hh = (bounds.h * TILE_SIZE) * cr;
      const xx = cx + ((layer.x + bounds.x) * TILE_SIZE) * cr;
      const yy = cy + ((layer.y + bounds.y) * TILE_SIZE) * cr;
      this.drawImage(
        layer.batch.texture,
        xx, yy,
        ww, hh
      );
    };
  }
  // render live data
  this.renderLayers();
  if (!this.states.drawing && (!this.states.select || !selection)) {
    this.renderHoveredTile();
  }
  if (this.shape !== null) this.renderShapeSelection();
  else if (selection) this.renderSelection();
  if (MODES.DEV) this.renderStats();
  this.redraw = false;
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
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const bounds = this.bounds;
  const layers = this.layers;
  // draw global boundings
  if (MODES.DEV) {
    const x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawRectangle(
      x, y,
      w, h,
      [0, 1, 0, 0.1]
    );
  }
  for (let ii = 0; ii < this.layers.length; ++ii) {
    const layer = layers[ii];
    const bounds = layer.bounds;
    if (layer.hidden) continue;
    //if (!this.boundsInsideView(bounds)) continue;
    // draw layer boundings
    if (MODES.DEV) {
      const x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
      const y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
      const w = ((bounds.w) * TILE_SIZE) * cr;
      const h = ((bounds.h) * TILE_SIZE) * cr;
      /*this.drawRectangle(
        x, y,
        w, h,
        [1, 0, 0, 0.1]
      );*/
    }
    this.renderLayer(layer);
  };
};

/**
 * @param {Layer} layer
 */
export function renderLayer(layer) {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const batches = layer.batches;
  const sindex = this.sindex;
  const cached = this.canRenderCachedBuffer();
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    if (cached && !batch.forceRendering) continue;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - batch.getStackIndex() < 0) {
      if (!batch.forceRendering) continue;
    }
    //if (!this.boundsInsideView(bounds)) continue;
    const x = (cx + (((layer.x + bounds.x) * TILE_SIZE) * cr)) | 0;
    const y = (cy + (((layer.y + bounds.y) * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    // draw batch boundings
    if (MODES.DEV) {
      this.drawRectangle(
        x, y,
        w, h,
        [1, 0, 0, 0.1]
      );
    }
    // erase by alpha blending
    if (batch.isEraser) {
      const gl = this.gl;
      gl.blendFuncSeparate(gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ZERO);
    }
    this.drawImage(
      batch.texture,
      x, y,
      w, h
    );
    // reset blending state
    if (batch.isEraser) {
      const gl = this.gl;
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
  };
};

export function getActiveCursorSize() {

};

export function renderHoveredTile() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  // apply empty tile hover color
  const mx = this.mx;
  const my = this.my;
  const relative = this.getRelativeTileOffset(mx, my);
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
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const xx = (cx + (this.sx * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.sy * TILE_SIZE) * cr) | 0;
  const ww = ((this.sw * TILE_SIZE) * cr) | 0;
  const hh = ((this.sh * TILE_SIZE) * cr) | 0;
  let color = (
    this.states.selecting ?
    SELECTION_COLOR_ACTIVE :
    SELECTION_COLOR
  );
  this.drawRectangle(
    xx, yy,
    ww, hh,
    color
  );
};

export function renderShapeSelection() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const batch = this.shape;
  const bounds = batch.bounds;
  const xx = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
  const yy = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
  const ww = (bounds.w * TILE_SIZE) * cr;
  const hh = (bounds.h * TILE_SIZE) * cr;
  this.drawImage(
    batch.texture,
    xx, yy, ww, hh
  );
};

export function renderStats() {
  const buffer = this.cache.fg;
  const bounds = this.bounds;
  const view = buffer.canvas;
  const texture = this.cache.fgTexture;
  const mx = this.last.mx;
  const my = this.last.my;
  // clear
  buffer.clearRect(0, 0, this.cw, this.ch);
  // font style
  buffer.font = "10px Verdana";
  buffer.fillStyle = "#fff";
  // stats
  buffer.fillText(`Mouse: x: ${mx}, y: ${my}`, 8, 16);
  buffer.fillText(`GPU textures: ${Object.keys(this.cache.gl.textures).length}`, 8, 28);
  buffer.fillText(`Boundings: x: ${bounds.x}, y: ${bounds.y}, w: ${bounds.w}, h: ${bounds.h}`, 8, 40);
  buffer.fillText(`Camera scale: ${this.cr}`, 8, 52);
  buffer.fillText(`Stack: ${this.sindex + 1}:${this.stack.length}`, 8, 64);
  // mouse color
  let color = this.getAbsolutePixelAt(mx, my);
  if (color !== null) {
    buffer.fillStyle = colorToRgbaString(color);
    buffer.fillRect(8, 70, 8, 8);
    buffer.fillStyle = "#fff";
    buffer.fillText(`${color[0]}, ${color[1]}, ${color[2]}, ${color[3]}`, 22, 77);
  }
  /*if (MODES.DEV) {
    const bounds = this.bounds;
    const cr = this.cr;
    const xx = ((this.cx | 0) + ((bounds.x * TILE_SIZE) * cr)) | 0;
    const yy = ((this.cy | 0) + ((bounds.y * TILE_SIZE) * cr)) | 0;
    const ww = (bounds.w * TILE_SIZE) * cr;
    const hh = (bounds.h * TILE_SIZE) * cr;
    this.drawResizeRectangle(xx, yy, ww, hh, "#313131");
  }*/
  if (this.sw !== 0 && this.sh !== 0) {
    this.drawSelectionShape();
  }
  // update texture, then draw it
  this.updateTextureByCanvas(texture, view);
  this.drawImage(
    texture,
    0, 0, view.width, view.height
  );
};

export function drawSelectionShape() {
  const cr = this.cr;
  const s = this.getSelection();
  const xx = ((this.cx | 0) + ((s.x * TILE_SIZE) * cr)) | 0;
  const yy = ((this.cy | 0) + ((s.y * TILE_SIZE) * cr)) | 0;
  const ww = (s.w * TILE_SIZE) * cr;
  const hh = (s.h * TILE_SIZE) * cr;
  const size = TILE_SIZE * cr;
  const buffer = this.cache.fg;
  buffer.strokeStyle = "rgba(255,255,255,0.7)";
  buffer.lineWidth = 0.45 * cr;
  buffer.setLineDash([size, size]);
  buffer.strokeRect(
    xx, yy,
    ww, hh
  );
};

/**
 * Draw resizable rectangle around given rectangle corners
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {String} color
 */
export function drawResizeRectangle(x, y, w, h, color) {
  const cr = this.cr;
  const ww = 4 * cr;
  const hh = 4 * cr;
  const buffer = this.cache.fg;
  buffer.strokeStyle = color;
  buffer.lineWidth = Math.max(0.4, 0.45 * cr);
  // main rectangle
  buffer.strokeRect(
    x, y,
    w, h
  );
  return;
  buffer.lineWidth = Math.max(0.4, 0.3 * cr);
  // left rectangle
  buffer.strokeRect(
    x - ww, (y + (h / 2) - hh / 2),
    ww, hh
  );
  // right rectangle
  buffer.strokeRect(
    x + w, (y + (h / 2) - hh / 2),
    ww, hh
  );
  // top rectangle
  buffer.strokeRect(
    (x + (w / 2) - ww / 2), y - hh,
    ww, hh
  );
  // bottom rectangle
  buffer.strokeRect(
    (x + (w / 2) - ww / 2), (y + h),
    ww, hh
  );
};
