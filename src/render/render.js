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
import { intersectRectangles } from "../math";

export function update() {
  const containers = this.containers;
  for (let ii = 0; ii < containers.length; ++ii) {
    const container = containers[ii];
    const ww = container.bounds.w;
    const hh = container.bounds.h;
    if (this.frames % 32 === 0) {
      const frame = container.animation.frame;
      container.animation.frame = (frame >= (ww * hh) - 1) ? 0 : frame + 1;
    }
    this.redraw = true;
  };
};

export function updateGrid() {
  // only redraw texture if it's absolutely necessary
  if (this.last.cx !== this.cx || this.last.cy !== this.cy) {
    this.redrawGridBuffer();
    this.redraw = true;
  }
};

/** Main render method */
export function render() {
  this.frames++;
  const selection = this.sw !== -0 && this.sh !== -0;
  const cr = this.cr;
  const gl = this.gl;
  const glOpacity = gl.getUniformLocation(this.program, "vOpacity");
  gl.uniform1f(
    glOpacity, 1.0
  );
  // clear foreground buffer
  this.cache.fg.clearRect(0, 0, this.cw, this.ch);
  this.renderBackground();
  //if (this.cr > HIDE_GRID) this.renderGrid();
  // render cached version of our working area
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  // draw global boundings
  if (MODES.DEV) {
    const bounds = this.bounds;
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
  // render containers
  const containers = this.containers;
  for (let ii = 0; ii < containers.length; ++ii) {
    const container = containers[ii];
    if (!container.visible) continue;
    this.renderContainer(container);
  };
  // render layers
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    if (!layer.visible) continue;
    gl.uniform1f(
      glOpacity, layer.opacity
    );
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
    // don't forget to render live batches
    this.renderLayer(layer);
  };
  gl.uniform1f(
    glOpacity, 1.0
  );
  if (!this.states.drawing && (!this.states.select || !selection)) {
    this.renderHoveredTile();
  }
  if (this.shape !== null) this.renderShapeSelection();
  else if (selection) this.renderSelection();
  if (MODES.DEV) this.renderStats();
  // render foreground buffer
  this.renderForeground();
  this.redraw = false;
};

/**
 * @param {Layer} layer
 */
export function renderLayer(layer) {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const gl = this.gl;
  const glOpacity = gl.getUniformLocation(this.program, "vOpacity");
  const batches = layer.batches;
  const sindex = this.sindex;
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    if (!batch.forceRendering) continue;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - batch.getStackIndex() < 0) {
      if (!batch.forceRendering) continue;
    }
    gl.uniform1f(
      glOpacity, layer.opacity
    );
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
    gl.uniform1f(
      glOpacity, 1.0
    );
  };
  // draw a thin rectangle around active layers
  if (MODES.DEV && layer.isActive) {
    const bounds = layer.bounds;
    const x = (cx + (((layer.x + bounds.x) * TILE_SIZE) * cr));
    const y = (cy + (((layer.y + bounds.y) * TILE_SIZE) * cr));
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    this.drawStrokedRect(x, y, w, h, "rgba(255,255,255,0.2)");
  }
};

/**
 * @param {Container} container
 */
export function renderContainer(container) {
  container.renderBoundings();
  const ww = container.bounds.w | 0;
  const hh = container.bounds.h | 0;
  for (let ii = 0; ii < ww * hh; ++ii) {
    container.renderFrame(ii);
  };
  container.renderAnimationPreview();
};

export function renderForeground() {
  const texture = this.cache.fgTexture;
  const fg = this.cache.fg;
  const view = fg.canvas;
  this.updateTextureByCanvas(texture, view);
  this.drawImage(
    texture,
    0, 0, view.width, view.height
  );
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
  const color = (
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
  const mx = this.last.mx;
  const my = this.last.my;
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
  buffer.setLineDash([0, 0]);
};

/**
 * Draws a stroked rectangle
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @param {String} color
 */
export function drawStrokedRect(x, y, w, h, color) {
  const cr = this.cr;
  const lw = Math.max(0.55, 0.55 * cr);
  const buffer = this.cache.fg;
  buffer.strokeStyle = color;
  buffer.lineWidth = lw;
  // main rectangle
  buffer.strokeRect(
    x - (lw / 2), y - (lw / 2),
    w + lw, h + lw
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
