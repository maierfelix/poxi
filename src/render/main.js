import { additiveAlphaColorBlending } from "../color";

/**
 * @return {String}
 */
export function exportAsDataUrl() {
  if (!(this.main.buffer instanceof CanvasRenderingContext2D)) return ("");
  const buffer = this.main.buffer;
  const view = buffer.canvas;
  return (view.toDataURL("image/png"));
};

export function refreshMainTexture() {
  const main = this.main;
  const ww = this.bounds.w; const hh = this.bounds.h;
  const resized = this.workingAreaHasResized();
  if (resized) {
    this.allocateMainBuffer();
    main.refreshTexture(true);
    if (main.texture instanceof WebGLTexture) {
      this.destroyTexture(main.texture);
    }
    main.texture = this.bufferTexture("main", main.data, ww, hh);
    //main.texture = this.bufferTextureByCanvas("main", main.buffer.canvas);
    console.log("Resized working area");
  }
  //this.updateMainBuffer();
  this.updateMainMatrix(resized);
};

export function allocateMainBuffer() {
  const main = this.main;
  const ww = this.bounds.w || 1; const hh = this.bounds.h || 1;
  const data = new Uint8Array(4 * (ww * hh));
  main.data = null;
  main.data = data;
};

/**
 * Manually update the main texture by summing matrices
 * @param {Boolean} resized 
 */
export function updateMainMatrix(resized) {
  const main = this.main;
  const buffer = main.data;
  const layers = this.layers;
  const sindex = this.sindex;
  // stack is out of position
  const oop = sindex < this.stack.length - 1;
  // we're out of stack position or resized, so redraw everything
  const resize = resized || oop;
  // boundings
  const x = this.bounds.x | 0; const y = this.bounds.y | 0;
  const w = this.bounds.w | 0; const h = this.bounds.h | 0;
  if (oop) main.clear();
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const batches = layer.batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      const data = batch.data;
      // ignore live refreshing batch and render them using renderLayers
      if (batch.forceRendering === true) continue;
      // only render our last added batch on top of everything
      if (resize === false && batch.getStackIndex() < sindex) continue;
      if (sindex - jj < 0) {
        const erase = this.buffers.erasing;
        // hack to display erasing batches when in erase mode
        if (erase !== batch) continue;
      }
      const bw = batch.bounds.w | 0;
      const bx = (layer.x + (batch.bounds.x - x)) | 0;
      const by = (layer.y + (batch.bounds.y - y)) | 0;
      const isEraser = batch.isEraser;
      // merge matrices
      for (let ii = 0; ii < data.length; ii += 4) {
        const idx = (ii / 4) | 0;
        const xx = (idx % bw) | 0;
        const yy = (idx / bw) | 0;
        const opx = ((yy * bw + xx) * 4) | 0;
        // ignore empty pixels
        if (data[opx + 3] <= 0) continue;
        const npx = (opx + (yy * (w - bw) * 4) + (bx * 4) + ((by * 4) * w)) | 0;
        // delete pixels if eraser batch
        if (isEraser === true) {
          buffer[npx + 0] = buffer[npx + 1] = buffer[npx + 2] = buffer[npx + 3] = 0;
          continue;
        }
        // already a color here, do manual additive color blending
        if (buffer[npx + 0] !== 0 && data[opx + 3] !== 255) {
          const src = buffer.subarray(npx, npx + 4);
          const dst = data.subarray(opx, opx + 4);
          const color = additiveAlphaColorBlending(src, dst);
          buffer[npx + 0] = color[0] | 0;
          buffer[npx + 1] = color[1] | 0;
          buffer[npx + 2] = color[2] | 0;
          buffer[npx + 3] = color[3] | 0;
          continue;
        }
        buffer[npx + 0] = data[opx + 0] | 0;
        buffer[npx + 1] = data[opx + 1] | 0;
        buffer[npx + 2] = data[opx + 2] | 0;
        buffer[npx + 3] = data[opx + 3] | 0;
      };
    };
  };
  this.updateTexture(main.texture, main.data, w, h);
};

/**
 * Canvas based way to generate a main texture
 */
export function updateMainBuffer() {
  const main = this.main;
  const buffer = main.buffer;
  const layers = this.layers;
  const sindex = this.sindex;
  const x = this.bounds.x; const y = this.bounds.y;
  const w = this.bounds.w; const h = this.bounds.h;
  buffer.clearRect(0, 0, w, h);
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
      // xor blending to erase
      if (isEraser) buffer.globalCompositeOperation = "xor";
      buffer.drawImage(
        batch.buffer.canvas,
        0, 0,
        bw, bh,
        bx, by,
        bw, bh
      );
      // reset blending
      if (isEraser) buffer.globalCompositeOperation = "source-over";
    };
  };
  this.updateTextureByCanvas(main.texture, main.buffer.canvas);
};
