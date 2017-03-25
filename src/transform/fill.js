import { BASE_TILE_COLOR } from "../cfg";

import {
  colorsMatch,
  colorToRgbaString,
  createCanvasBuffer
} from "../utils";

import CommandKind from "../stack/kind";

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  // differentiate between empty and colored tiles
  const base = this.getPixelAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) return;
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  // save the current stack index
  const sindex = this.sindex;
  const batch = this.createDynamicBatch();
  const layer = this.getCurrentLayer();
  // flood fill
  const result = this.binaryFloodFill(batch, x, y, base, color);
  // ups, we filled infinite
  if (result) return;
  layer.addBatch(batch);
  const kind = result ? CommandKind.BACKGROUND : CommandKind.FILL;
  this.enqueue(kind, batch);
  this.updateGlobalBoundings();
  return;
};

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive" cells at the grid,
 * then we take the boundings of the used/filled area of our grid and crop out
 * the relevant part. Then we convert the filled grid area into a raw buffer
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Boolean}
 */
export function binaryFloodFill(batch, x, y, base, color) {
  const bounds = this.bounds;
  const bx = bounds.x;
  const by = bounds.y;
  const gw = bounds.w;
  const gh = bounds.h;
  const isEmpty = base[3] === 0;
  const gridl = gw * gh;

  // allocate and do a basic fill onto the grid
  let grid = new Uint8ClampedArray(gw * gh);
  for (let ii = 0; ii < gridl; ++ii) {
    const xx = ii % gw;
    const yy = (ii / gw) | 0;
    const color = this.getPixelAt(bx + xx, by + yy);
    // empty tile based
    if (isEmpty) { if (color !== null) continue; }
    // color based
    else {
      if (color === null) continue;
      if (!(base[0] === color[0] && base[1] === color[1] && base[2] === color[2])) continue;
    }
    // fill tiles with 1's if we got a color match
    grid[yy * gw + xx] = 1;
  };

  // trace connected tiles by [x,y]=2
  let queue = [{x: x - bx, y: y - by}];
  while (queue.length > 0) {
    const point = queue.pop();
    const x = point.x;
    const y = point.y;
    const idx = y * gw + x;
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) grid[idx] = 2;
    const nn = (y-1) * gw + x;
    const ee = y * gw + (x+1);
    const ss = (y+1) * gw + x;
    const ww = y * gw + (x-1);
    // abort if we possibly go infinite
    if (
      (y - 1 < -1 || y - 1 > gh) ||
      (x + 1 < -1 || x + 1 > gw) ||
      (y + 1 < -1 || y + 1 > gh) ||
      (x - 1 < -1 || x - 1 > gw)
    ) return (true);
    if (grid[nn] === 1) queue.push({x, y:y-1});
    if (grid[ee] === 1) queue.push({x:x+1, y});
    if (grid[ss] === 1) queue.push({x, y:y+1});
    if (grid[ww] === 1) queue.push({x:x-1, y});
  };

  // convert cropped area into raw buffer
  const buffer = createCanvasBuffer(gw, gh);
  buffer.fillStyle = colorToRgbaString(color);
  for (let ii = 0; ii < gw * gh; ++ii) {
    const xx = ii % gw;
    const yy = (ii / gw) | 0;
    if (grid[yy * gw + xx] !== 2) continue;
    buffer.fillRect(
      xx, yy, 1, 1
    );
  };

  // update batch with final result
  batch.buffer = buffer;
  batch.data = buffer.getImageData(0, 0, gw, gh).data;
  batch.bounds.update(bx, by, gw, gh);
  batch.isResized = true;
  batch.resizeByBufferData();
  batch.refreshTexture();

  // finally free things from memory
  grid = null;

  return (false);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function floodPaint(x, y) {
  const color = this.fillStyle;
  const base = this.getPixelAt(x, y);
  // empty base tile or colors to fill are the same
  if (base === null || colorsMatch(base, color)) return;
  const xx = this.bounds.x;
  const yy = this.bounds.y;
  const ww = this.bounds.w;
  const hh = this.bounds.h;
  const layer = this.getCurrentLayer();
  const batch = this.createDynamicBatch();
  batch.prepareBuffer(xx, yy);
  batch.resizeByOffset(xx, yy);
  batch.resizeByOffset(xx + ww, yy + hh);
  // flood paint
  let count = 0;
  for (let ii = 0; ii < ww * hh; ++ii) {
    const x = (ii % ww);
    const y = (ii / ww) | 0;
    const pixel = this.getPixelAt(xx + x, yy + y);
    if (pixel === null) continue;
    if (!colorsMatch(base, pixel)) continue;
    batch.drawTile(xx + x, yy + y, 1, 1, color);
    count++;
  };
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.isResized = true;
  batch.refreshTexture();
  layer.addBatch(batch);
  this.enqueue(CommandKind.FLOOD_FILL, batch);
  return;
};
