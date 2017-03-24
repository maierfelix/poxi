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
  batches.map((batch) => batch.refreshTexture());
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
  batches.map((batch) => batch.refreshTexture());
};
