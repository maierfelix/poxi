import { colorToRgbaString } from "../utils";

/**
 * Erases related pixel tiles in given batches
 */
export function dejectErasedTiles() {
  const tiles = this.erased;
  const batches = [];
  for (let ii = 0; ii < tiles.length; ++ii) {
    const tile = tiles[ii];
    const batch = tile.batch;
    const x = tile.x - batch.bounds.x;
    const y = tile.y - batch.bounds.y;
    // clear old batch
    batch.buffer.clearRect(
      x, y,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) batches.push(batch);
  };
  // make sure to refresh a batch's buffer only once
  batches.map((batch) => batch.refreshBuffer());
};

/**
 * Redraws related pixel tiles in given batches
 */
export function injectErasedTiles() {
  const tiles = this.erased;
  const batches = [];
  for (let ii = 0; ii < tiles.length; ++ii) {
    const tile = tiles[ii];
    const batch = tile.batch;
    const color = colorToRgbaString(tile.pixel);
    const x = tile.x - batch.bounds.x;
    const y = tile.y - batch.bounds.y;
    batch.buffer.fillStyle = color;
    batch.buffer.fillRect(
      x, y,
      1, 1
    );
    if (batches.indexOf(batch) <= -1) batches.push(batch);
  };
  // make sure to refresh a batch's buffer only once
  batches.map((batch) => batch.refreshBuffer());
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function erase(x, y) {
  const data = this.instance.getPixelsAt(x, y);
  const bounds = this.bounds; 
  const instance = this.instance;
  const pixels = data.pixels;
  this.prepareBuffer(x, y);
  if (pixels.length) this.resizeByOffset(x, y);
  const buffer = this.buffer;
  for (let ii = 0; ii < pixels.length; ++ii) {
    this.erased.push(pixels[ii]);
    const batch = pixels[ii].batch;
    const pixel = pixels[ii].pixel;
    const xx = x - batch.bounds.x;
    const yy = y - batch.bounds.y;
    // clear old batch
    batch.buffer.clearRect(
      xx, yy,
      1, 1
    );
    //batch.resizeByBufferData();
    batch.refreshBuffer();
  };
  this.refreshBuffer();
  return;
};
