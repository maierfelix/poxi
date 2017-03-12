import { sortAscending } from "../utils";
import { BATCH_BUFFER_SIZE } from "../cfg";
import { intersectRectangles } from "../math";

/**
 * Updates the batch's relative position and size
 * @return {Void}
 */
export function updateBoundings() {
  const info = this.getBoundings();
  this.bx = info.x;
  this.by = info.y;
  this.bw = info.w;
  this.bh = info.h;
};

/**
 * @return {Object}
 */
export function getBoundings() {
  let x = 0;
  let y = 0;
  let w = 0;
  let h = 0;
  // background boundings are infinite
  if (this.isBackground) {
    x = y = -Infinity;
    w = h = Infinity;
  } else {
    x = 0;
    y = 0;
    w = 8;
    h = 8;
  }
  return ({x, y, w, h});
};
