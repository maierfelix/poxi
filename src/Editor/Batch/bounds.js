import { sortAscending } from "../../utils";
import { BATCH_BUFFER_SIZE } from "../../cfg";
import { intersectRectangles } from "../../math";

/**
 * Determine if we should buffer the batch or not
 * Buffering a batch takes only in place, when drawImage is likely
 * faster than the (faster for single tiles) fillRect method
 * @return {Boolean}
 */
export function exceedsBoundings() {
  if (this.tiles.length >= BATCH_BUFFER_SIZE.MIN_L) return (true);
  let size = this.getBoundings();
  return (
    size.w - 1 >= BATCH_BUFFER_SIZE.MIN_W ||
    size.h - 1 >= BATCH_BUFFER_SIZE.MIN_H
  );
};

/**
 * Check if points lies inside the batch
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean}
 */
export function pointInsideBoundings(x, y) {
  if (this.isBackground) return (true);
  let state = intersectRectangles(
    this.x, this.y, this.width, this.height,
    x, y, 0, 0
  );
  return (state);
};

/**
 * Updates the batch's relative position and size
 * @return {Void}
 */
export function updateBoundings() {
  // dont calculate sizes of raw buffers
  if (this.isRawBuffer) return;
  // background boundings are infinite
  if (this.isBackground) {
    this.x = this.y = this.width = this.height = Infinity;
    return;
  }
  let info = this.getBoundings();
  this.x = info.x;
  this.y = info.y;
  this.width = info.w;
  this.height = info.h;
  return;
};

/**
 * Calculate cropped size of given batch
 * @return {Object}
 */
export function getBoundings() {
  // raw buffers have static bounding
  if (this.isRawBuffer) {
    return ({
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    });
  }
  let px = [];
  let py = [];
  let tiles = this.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    px.push(tile.x);
    py.push(tile.y);
  };
  px.sort(sortAscending);
  py.sort(sortAscending);
  let idx = px.length-1;
  // calculate rectangle position
  let xx = px[0]|0;
  let yy = py[0]|0;
  // calculate rectangle size
  let ww = ((px[idx] - px[0]) | 0) + 1;
  let hh = ((py[idx] - py[0]) | 0) + 1;
  return ({
    x: xx,
    y: yy,
    w: ww,
    h: hh
  });
};
