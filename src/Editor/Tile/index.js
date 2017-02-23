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
    this.overwrite = [];
    this.isHovered = false;
  }
  /**
   * @param {Number} cindex
   * @return {String}
   */
  getColorAsRgbaString(cindex) {
    cindex = cindex || 0;
    let color = this.colors[cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    return (
      `rgba(${r},${g},${b},${a})`
    );
  }
};

export default Tile;
