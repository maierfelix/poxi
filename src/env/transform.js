import CommandKind from "../stack/kind";

/**
 * Rotate in 90° steps
 * @param {Number} value
 */
export function rotate(value) {
  value = value ? 90 : -90;
};

/**
 * @param {Batch} base
 * @param {Boolean} vertical
 * @return {Void}
 */
export function flip(base, vertical) {
  const x = base.bounds.x;
  const y = base.bounds.y;
  const ww = base.bounds.w;
  const hh = base.bounds.h;
  const batch = layer.createBatchAt(x, y);
  batch.resizeRectangular(
    x, y,
    ww - 1, hh - 1
  );
  let count = 0;
  for (let ii = 0; ii < ww * hh; ++ii) {
    const xx = (ii % ww) | 0;
    const yy = (ii / ww) | 0;
    const pixel = base.getRawPixelAt(x + xx, y + yy);
    if (pixel === null) continue;
    const rx = (!vertical ? x + (ww - xx) - 1 : (x + xx)) | 0;
    const ry = ( vertical ? y + (hh - yy) - 1 : (y + yy)) | 0;
    batch.erasePixelFast(x + xx, y + yy, pixel);
    batch.drawPixelFast(rx, ry, pixel);
    count++;
  };
  if (count <= 0) {
    batch.kill();
    return;
  }
  this.enqueue(CommandKind.FLIP, batch);
  return;
};
