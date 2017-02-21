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
    this.isHovered = false;
  }
};

export default Tile;
