/**
 * @class Tile
 */
class Tile {
  constructor() {
    this.x = 0;
    this.y = 0;
    /**
     * color index to restore previous color states
     */
    this.cindex = 0;
    this.colors = [];
  }
};

export default Tile;