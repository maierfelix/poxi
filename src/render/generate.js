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

import {
  additiveAlphaColorBlending
} from "../color";

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

export function createMainBuffer() {
  const main = this.main;
  const ww = this.bounds.w; const hh = this.bounds.h;
  if (this.workingAreaHasResized()) {
    this.allocateMainBuffer();
    if (main.texture instanceof WebGLTexture) {
      this.destroyTexture(main.texture);
    }
    main.texture = this.bufferTexture("main", main.data, ww, hh);
    console.log("Resized working area");
  }
  this.updateMainBuffer();
};

export function allocateMainBuffer() {
  const main = this.main;
  const ww = this.bounds.w || 1; const hh = this.bounds.h || 1;
  const data = new Uint8Array((ww * hh) * 4);
  main.data = data;
};

export function updateMainBuffer() {
  const main = this.main;
  const buffer = main.data;
  const layers = this.layers;
  const sindex = this.sindex;
  const x = this.bounds.x; const y = this.bounds.y;
  const w = this.bounds.w; const h = this.bounds.h;
  main.clear();
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const lx = layer.x;
    const ly = layer.y;
    const batches = layer.batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      const data = batch.data;
      if (sindex - jj < 0) {
        const erase = this.buffers.erasing;
        // hack to display erasing batches when in erase mode
        if (erase !== batch) continue;
      }
      const bw = batch.bounds.w;
      const bh = batch.bounds.h;
      const bx = lx + (batch.bounds.x - x);
      const by = ly + (batch.bounds.y - y);
      const isEraser = batch.isEraser;
      // merge matrices
      for (let ii = 0; ii < data.length; ii += 4) {
        const idx = ii / 4;
        const xx = idx % bw;
        const yy = (idx / bw) | 0;
        const opx = (yy * bw + xx) * 4;
        const npx = opx + (yy * (w - bw) * 4) + (bx * 4) + ((by * 4) * w);
        // ignore empty pixels
        if (data[opx + 3] <= 0) continue;
        // delete pixels if eraser batch
        if (isEraser) {
          buffer[npx + 0] = buffer[npx + 1] = buffer[npx + 2] = buffer[npx + 3] = 0;
          continue;
        }
        // already a color here, do manual additive color blending
        if (buffer[npx + 0] !== 0) {
          const src = buffer.subarray(npx, npx + 4);
          const dst = data.subarray(opx, opx + 4);
          const color = additiveAlphaColorBlending(src, dst);
          buffer[npx + 0] = color[0];
          buffer[npx + 1] = color[1];
          buffer[npx + 2] = color[2];
          buffer[npx + 3] = color[3];
          continue;
        }
        buffer[npx + 0] = data[opx + 0];
        buffer[npx + 1] = data[opx + 1];
        buffer[npx + 2] = data[opx + 2];
        buffer[npx + 3] = data[opx + 3];
      };
    };
  };
  this.updateTexture(main.texture, main.data, w, h);
};
