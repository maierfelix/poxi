import {
  TILE_SIZE
} from "../cfg";

import { roundTo } from "../math";

import Tile from "./Tile/index";

/**
 * Set ctrl+a mode=true
 */
export function selectAll() {
  this.modes.selectAll = true;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} state
 */
export function select(x, y, state) {
  this.modes.drag = state;
  this.modes.draw = !!state;
  if (state && this.modes.draw) {
    this.colorTest = this.setRandomColor();
    this.pushTileBatchOperation();
    this.pushTileBatch(x, y);
    this.clearLatestTileBatch();
  } else {
    let offset = this.batches.tiles.length - 1;
    this.enqueue({
      batch: this.batches.tiles[offset],
      index: offset
    });
  }
};

/**
 * Clear latest batch operation if empty
 */
export function clearLatestTileBatch() {
  let batch = this.getLatestTileBatchOperation();
  // latest batch operation is empty, remove so 
  if (batch.length <= 0) {
    let offset = this.batches.tiles.length - 1;
    this.batches.tiles.splice(offset, 1);
  }
};

/**
 * @return {Array}
 */
export function setRandomColor() {
  let r = ((Math.random() * 255) + 1) | 0;
  let g = ((Math.random() * 255) + 1) | 0;
  let b = ((Math.random() * 255) + 1) | 0;
  return ([r, g, b, 1]);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
export function getRelativeOffset(x, y) {
  let pos = this.camera.getRelativeOffset(x, y);
  let half = TILE_SIZE / 2;
  pos.x = roundTo(pos.x - half, TILE_SIZE);
  pos.y = roundTo(pos.y - half, TILE_SIZE);
  return (pos);
};

/**
 * @param {Number} x
 * @param {Number} y
 */
export function createTileByMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = new Tile();
  tile.x = position.x;
  tile.y = position.y;
  return (tile);
};

/**
 * @return {Array}
 */
export function getLatestTileBatchOperation() {
  let offset = this.batches.tiles.length - 1;
  let batch = this.batches.tiles;
  return (batch[offset]);
};

/**
 * Push in a new batch operation
 */
export function pushTileBatchOperation() {
  let operation = [];
  this.batches.tiles.push(operation);
};

/**
 * Clear earlier tile at given position
 * => update its color and old color value
 * @param {Number} x
 * @param {Number} y
 * @return {Number}
 */
export function getTileFromMouseOffset(x, y) {
  let position = this.getRelativeOffset(x, y);
  let tile = this.findTileAt(position.x, position.y);
  return (tile);
};

/**
 * Collect all tiles at given relative position
 * @param {Number} x
 * @param {Number} y
 * @return {Tile}
 */
export function findTileAt(x, y) {
  let target = null;
  let batches = this.batches.tiles;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii];
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      if (tile.x === x && tile.y === y) {
        target = tile;
      }
    };
  };
  return (target);
};

/**
 * Create, push and batch a new tile at x,y
 * @param {Number} x
 * @param {Number} y
 */
export function pushTileBatch(x, y) {
  let otile = this.getTileFromMouseOffset(x, y);
  let color = [
    this.colorTest[0],
    this.colorTest[1],
    this.colorTest[2],
    this.colorTest[3]
  ];
  let batch = this.getLatestTileBatchOperation();
  // previous tile found, update it
  if (otile !== null) {
    let ocolors = otile.colors[otile.cindex];
    // check if we have to overwrite the old tiles color
    // e.g => push in a new color state
    let matches = this.colorArraysMatch(
      color,
      ocolors
    );
    // old and new colors doesnt match, insert new color values
    // into the old tile's color array to save its earlier state
    // as well as push in a new stack operation
    if (!matches && ocolors[3] !== 2) {
      otile.colors.unshift(color);
      batch.push(otile);
    }
  // if no tile found, create one and push it into the batch
  } else {
    let tile = this.createTileByMouseOffset(x, y);
    tile.colors.unshift(color);
    batch.push(tile);
  }
};

/**
 * Compare two color arrays if they match both
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 */
export function colorArraysMatch(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
  );
};

/**
 * Just set isHovered=false in hovered tiles array
 */
export function unHoverAllTiles() {
  for (let ii = 0; ii < this.hovered.length; ++ii) {
    this.hovered[ii].isHovered = false;
    this.hovered.splice(ii, 1);
  };
};

/**
 * @param {Tile} tile
 * @return {Boolean}
 */
export function isTileInsideView(tile) {
  let scale = this.camera.s;
  let width = this.camera.width;
  let height = this.camera.height;
  let tilew = TILE_SIZE * scale;
  let tileh = TILE_SIZE * scale;
  let x = (tile.x * scale) + this.camera.x;
  let y = (tile.y * scale) + this.camera.y;
  return (
    (x + tilew) >= 0 && x <= width &&
    (y + tileh) >= 0 && y <= height
  );
};