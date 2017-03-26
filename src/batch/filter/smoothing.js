
/**
 * Remove L shaped corners
 * http://deepnight.net/pixel-perfect-drawing/
 * @param {Batch} batch
 */
export function applyPixelSmoothing(batch) {
  const bw = batch.bounds.w;
  const bh = batch.bounds.h;
  const tiles = batch.data;
  for (let ii = 0; ii < tiles.length; ii += 4) {
    if (!(ii > 0 && ii + 1 < tiles.length)) continue;
    const x = (ii % bw);
    const y = (ii / bw) | 0;
    const px = (yy * bw + xx) * 4;
    if (
      (w.x === o.x  || w.y === o.y) &&
      (e.x === o.x  || e.y === o.y) &&
      (w.x !== e.x) && (w.y !== e.y)
    ) {
      tiles[ii + 0] = 0;
      tiles[ii + 1] = 0;
      tiles[ii + 2] = 0;
      tiles[ii + 3] = 0;
    }
  };
};
