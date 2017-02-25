import { TILE_SIZE } from "../cfg";

import { roundTo } from "../math";
import { createCanvasBuffer } from "../utils";

import Tile from "./Tile/index";
import Batch from "./Batch/index";

/**
 * Shade or tint
 * @param {Batch} batch
 * @param {Number} factor
 */
export function applyColorLightness(batch, factor) {
  let tiles = batch.tiles;
  this.pushTileBatchOperation();
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let color = tile.colors[tile.cindex];
    let t = factor < 0 ? 0 : 255;
    let p = factor < 0 ? -factor : factor;
    let r = (Math.round((t - color[0]) * p) + color[0]);
    let g = (Math.round((t - color[1]) * p) + color[1]);
    let b = (Math.round((t - color[2]) * p) + color[2]);
    let a = color[3];
    this.createBatchTileAt(tile.x, tile.y, [r,g,b,a]);
  };
  this.finalizeBatchOperation();
};

/**
 * Remove L shaped corners
 * http://deepnight.net/pixel-perfect-drawing/
 * @param {Batch} batch
 */
export function applyPixelSmoothing(batch) {
  let tiles = batch.tiles;
  for (let ii = 0; ii < tiles.length; ++ii) {
    if (!(ii > 0 && ii + 1 < tiles.length)) continue;
    let o = tiles[ii];
    let e = tiles[ii + 1];
    let w = tiles[ii - 1];
    if (
      (w.x === o.x  || w.y === o.y) &&
      (e.x === o.x  || e.y === o.y) &&
      (w.x !== e.x) && (w.y !== e.y)
    ) {
      tiles.splice(ii, 1);
      ++ii;
    }
  };
};
