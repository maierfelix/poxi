import { BASE_TILE_COLOR } from "../../cfg";
import { uid, colorsMatch } from "../../utils";

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
  /**
   * @param {Array} color
   * @return {Boolean}
   */
  colorMatchesWithTile(color) {
    return (
      colorsMatch(this.colors[this.cindex], color)
    );
  }
  /**
   * @param {Number} cindex
   * @return {String}
   */
  getColorAsRgbaString(cindex) {
    let c = this.colors[cindex || 0];
    let r = c[0];
    let g = c[1];
    let b = c[2];
    let a = c[3];
    return (
      `rgba(${r},${g},${b},${a})`
    );
  }
};

export default Tile;
