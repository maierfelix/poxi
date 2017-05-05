/**
 * @param {Layer} layer
 */
export function flipHorizontally(layer) {
  const batch = layer.batch;
  const data = batch.data;
  const ww = batch.bounds.w;
  const hh = batch.bounds.h;
  const pixels = new Uint8Array(data.length);
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % ww) | 0;
    const yy = (idx / ww) | 0;
    const opx = 4 * (yy * ww + xx);
    const npx = 4 * ((ww - xx) + (yy * ww) - 1);
    pixels[opx + 0] = data[npx + 0];
    pixels[opx + 1] = data[npx + 1];
    pixels[opx + 2] = data[npx + 2];
    pixels[opx + 3] = data[npx + 3];
  };
  batch.data = pixels;
  batch.refreshTexture(true);
};

/**
 * @param {Layer} layer
 */
export function flipVertically(layer) {
  const batch = layer.batch;
  const data = batch.data;
  const ww = batch.bounds.w;
  const hh = batch.bounds.h;
  const pixels = new Uint8Array(data.length);
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % ww) | 0;
    const yy = (idx / ww) | 0;
    const opx = 4 * (yy * ww + xx);
    const npx = 4 * (((hh - yy - 1) * ww) + xx);
    pixels[opx + 0] = data[npx + 0];
    pixels[opx + 1] = data[npx + 1];
    pixels[opx + 2] = data[npx + 2];
    pixels[opx + 3] = data[npx + 3];
  };
  batch.data = pixels;
  batch.refreshTexture(true);
};
