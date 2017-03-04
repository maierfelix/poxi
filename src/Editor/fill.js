import {
  colorsMatch,
  isGhostColor,
  sortAscending,
  colorToRgbaString,
  createCanvasBuffer
} from "../utils";

import { BASE_TILE_COLOR } from "../cfg";

/**
 * Fill enclosed tile area
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function fillBucket(x, y, color) {
  // TODO: add method to create temporary batches (e.g. insertRectangle by mouse)
  color = color || [255, 255, 255, 1];
  if (color[3] > 1) throw new Error("Invalid alpha color!");
  // differentiate between empty and colored tiles
  let base = this.getStackRelativeTileColorAt(x, y) || BASE_TILE_COLOR;
  // clicked tile color and fill colors matches, abort
  if (colorsMatch(base, color)) return;
  // clear undone batches, since we dont need them anymore
  this.refreshStack();
  // we now need the most recent boundings
  this.updateGlobalBoundings();
  // save the current stack index
  let sindex = this.sindex;
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  // flood fill
  let result = this.binaryFloodFill(x, y, base, color);
  // convert buffer into batched raw buffer
  batch.createRawBufferAt(result.buffer, result.x, result.y);
  // after filling, finally update the boundings to get the batch's size
  batch.updateBoundings();
  // make sure we only create a raw buffer if we got tiles to draw onto
  if (batch.tiles.length) this.batchTilesToRawBuffer(batch, color);
  // finalizing a batch also deletes the batch if we didn't change anything
  this.finalizeBatchOperation();
  // infinity got detected, but some batches could be drawn before, so clear them first
  if (false) {
    // remove our recent batch if it didn't got removed yet
    if (sindex < this.sindex) {
      this.undo();
      this.refreshStack();
    }
    // finally create a background batch
    this.fillBackground(color);
  }
  return;
};

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive" cells at the grid,
 * then we take the boundings of the used/filled area of our grid and crop out
 * the relevant part. Then we convert the filled grid area into a raw buffer
 * TODO: Fails with negative coordinates and infinity
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @param {Array} color
 * @return {Object}
 */
export function binaryFloodFill(x, y, base, color) {
  let bounds = this.boundings;
  let bx = bounds.x;
  let by = bounds.y;
  let gw = bounds.w;
  let gh = bounds.h;
  let isEmpty = base[3] === 0;
  let gridl = gw * gh;

  // allocate and do a basic fill onto the grid
  let grid = new Uint8ClampedArray(gw * gh);
  for (let ii = 0; ii < gridl; ++ii) {
    let xx = ii % gw;
    let yy = (ii / gw) | 0;
    let color = this.getTileColorAt(bx + xx, by + yy);
    if (isEmpty) {
      if (color !== null) continue;
    } else {
      if (color === null) continue;
      if (!(base[0] === color[0] && base[1] === color[1] && base[2] === color[2])) continue;
    }
    // fill tiles with 1's if we got a color match
    grid[yy * gw + xx] = 1;
  };

  // trace connected tiles by [x,y]=2
  let queue = [{x, y}];
  while (queue.length > 0) {
    let point = queue.pop();
    let x = point.x;
    let y = point.y;
    let idx = y * gw + x;
    // detected infinite filling, skip and return true=^infinite
    //if (!this.pointInsideAbsoluteBoundings(x, y)) return (true);
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) grid[idx] = 2;
    let nn = (y-1) * gw + x;
    let ee = y * gw + (x+1);
    let ss = (y+1) * gw + x;
    let ww = y * gw + (x-1);
    if (nn < gridl && grid[nn] === 1) queue.push({x, y:y-1});
    if (ee < gridl && grid[ee] === 1) queue.push({x:x+1, y});
    if (ss < gridl && grid[ss] === 1) queue.push({x, y:y+1});
    if (ww < gridl && grid[ww] === 1) queue.push({x:x-1, y});
  };

  // calculate crop factor
  let px = [];
  let py = [];
  for (let ii = 0, length = grid.length; ii < length; ++ii) {
    let xx = ii % gw;
    let yy = (ii / gw) | 0;
    if (grid[ii] !== 2) continue;
    px.push(xx);
    py.push(yy);
  };
  px.sort(sortAscending);
  py.sort(sortAscending);
  // calculate position
  let sx = px[0] | 0;
  let sy = py[0] | 0;
  // calculate rectangle size
  let ww = ((px[px.length - 1] - sx) | 0) + 1;
  let hh = ((py[py.length - 1] - sy) | 0) + 1;

  // convert cropped area into raw buffer
  let buffer = createCanvasBuffer(ww, hh);
  buffer.fillStyle = colorToRgbaString(color);
  for (let ii = 0; ii < ww * hh; ++ii) {
    let xx = ii % ww;
    let yy = (ii / ww) | 0;
    let gx = sx + xx;
    let gy = sy + yy;
    if (grid[gy * gw + gx] !== 2) continue;
    buffer.fillRect(
      xx, yy, 1, 1
    );
  };

  // finally free things from memory
  grid = null;
  px = null; py = null;

  return ({
    x: sx,
    y: sy,
    width: ww,
    height: hh,
    buffer: buffer
  });
};

/**
 * Sets a batch to background, appends the given bg color
 * and generates a camera width and height based buffered canvas
 * @param {Array} color
 */
export function fillBackground(color) {
  let isempty = isGhostColor(color);
  this.pushTileBatchOperation();
  let batch = this.getLatestTileBatchOperation();
  batch.isBackground = true;
  batch.renderBackground(this.camera.width, this.camera.height, color);
  batch.updateBoundings();
  this.finalizeBatchOperation();
};
