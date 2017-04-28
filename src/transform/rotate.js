/**
 * @param {Layer} layer
 */
export function rotateRight(layer) {
  const main = layer.batch;
  const batch = layer.createBatchAt(
    main.bounds.x, main.bounds.y
  );
  const data = main.data;
  const ww = main.bounds.w;
  const hh = main.bounds.h;
	const pixels = new Uint8Array(data.length);
	for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % ww) | 0;
		const yy = (idx / ww) | 0;
    const opx = 4 * (yy * ww + xx);
    const npx = 4 * ((xx * ww) + (hh - yy - 1));
    pixels[opx + 0] = data[npx + 0];
    pixels[opx + 1] = data[npx + 1];
    pixels[opx + 2] = data[npx + 2];
    pixels[opx + 3] = data[npx + 3];
	};
  batch.data = pixels;
  batch.bounds.w = hh;
  batch.bounds.h = ww;
  batch.refreshTexture(true);
  main.refreshTexture(true);
  layer.updateBoundings();
  layer.bounds.w = hh;
  layer.bounds.h = ww;
  main.bounds.w = hh;
  main.bounds.h = ww;
  main.data = pixels;
  this.updateGlobalBoundings();
};

export function rotateLeft() {

};
