import { BASE_TILE_COLOR } from "../../cfg";
import { uid } from "../../utils";

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
    let owncolor = this.colors[this.cindex];
    return (
      owncolor[0] === color[0] &&
      owncolor[1] === color[1] &&
      owncolor[2] === color[2] &&
      owncolor[3] === color[3]
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
