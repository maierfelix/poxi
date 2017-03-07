import { BASE_TILE_COLOR } from "../../cfg";

import {
  uid,
  rgbaToBytes,
  colorsMatch
} from "../../utils";

/**
 * @class Tile
 */
class Tile {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.id = uid();
    this.cindex = 0;
    this.colors = [BASE_TILE_COLOR];
  }
};

/**
 * @param {Array} color
 * @return {Boolean}
 */
Tile.prototype.colorMatchesWithTile = function(color) {
  return (
    colorsMatch(this.colors[this.cindex], color)
  );
};

/**
 * @return {Array}
 */
Tile.prototype.getColorAsRgbaBytes = function() {
  return (rgbaToBytes(this.colors[this.cindex]));
};

/**
 * @return {String}
 */
Tile.prototype.getColorAsRgbaString = function() {
  let c = this.colors[this.cindex];
  let r = c[0];
  let g = c[1];
  let b = c[2];
  let a = c[3];
  return (
    `rgba(${r},${g},${b},${a})`
  );
};

export default Tile;
