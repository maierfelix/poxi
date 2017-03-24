import CommandKind from "../stack/kind";

/**
 * @param {Object} selection
 */
export function copy(selection) {
  const x = selection.x; const y = selection.y;
  const w = selection.w; const h = selection.h;
  let pixels = [];
  this.clipboard.copy = null;
  for (let ii = 0; ii < w * h; ++ii) {
    let xx = ii % w;
    let yy = (ii / w) | 0;
    let pixel = this.getPixelAt(x + xx, y + yy);
    if (pixel === null) continue;
    pixels.push({
      x: xx, y: yy, color: pixel
    });
  };
  this.clipboard.copy = pixels;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} pixels
 * @return {Void}
 */
export function paste(x, y, pixels) {
  if (pixels === null || !pixels.length) return;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  batch.prepareBuffer(x, y);
  for (let ii = 0; ii < pixels.length; ++ii) {
    const pixel = pixels[ii];
    const color = pixel.color;
    batch.drawTile(pixel.x + x, pixel.y + y, 1, 1, color);
  };
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.PASTE, batch);
  return;
};

/**
 * @param {Object} selection
 * @return {Void}
 */
export function cut(selection) {
  this.copy(selection);
  const pixels = this.clipboard.copy;
  if (pixels === null || !pixels.length) return;
  this.clearRect(selection);
  return;
};

/**
 * @param {Object} selection
 * @return {Void}
 */
export function clearRect(selection) {
  const x = selection.x; const y = selection.y;
  const w = selection.w; const h = selection.h;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  batch.isEraser = true;
  batch.prepareBuffer(x, y);
  batch.clearRect(x, y, w, h);
  batch.refreshTexture();
  // empty batch, got no tiles to delete
  if (!batch.erased.length) return;
  layer.addBatch(batch);
  this.enqueue(CommandKind.CLEAR, batch);
  return;
};
