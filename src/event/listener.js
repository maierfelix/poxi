import {
  rgbaToBytes,
  getRainbowColor
} from "../utils";

import { MODES } from "../cfg";

import CommandKind from "../stack/kind";

export function initListeners() {
  window.addEventListener("resize", (e) => this.onResize(e));

  window.addEventListener("mouseout", (e) => this.onMouseOut(e));
  window.addEventListener("mouseleave", (e) => this.onMouseLeave(e));

  window.addEventListener("mousedown", (e) => this.onMouseDown(e));
  window.addEventListener("mouseup", (e) => this.onMouseUp(e));

  window.addEventListener("mousemove", (e) => this.onMouseMove(e));

  window.addEventListener("keydown", (e) => this.onKeyDown(e));
  window.addEventListener("keyup", (e) => this.onKeyUp(e));

  window.addEventListener("contextmenu", (e) => this.onContextmenu(e));

  window.addEventListener("wheel", (e) => this.onMouseWheel(e));
  window.addEventListener("mousewheel", (e) => this.onMouseWheel(e));
};

/**
 * @param {Event} e
 */
export function onResize(e) {
  this.resize(
    window.innerWidth, window.innerHeight
  );
};

/**
 * @param {Event} e
 */
export function onMouseOut(e) {
  e.preventDefault();

};

/**
 * @param {Event} e
 */
export function onMouseLeave(e) {
  e.preventDefault();

};

/**
 * @param {Event} e
 */
export function onMouseDown(e) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  if (e.which === 1) {
    this.resetSelection();
    // debug helper
    (() => {
      const relative = this.getRelativeTileOffset(x, y);
      //console.log(relative.x, relative.y);
    })();
    if (this.states.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else if (this.modes.draw) {
      this.states.drawing = true;
      this.buffers.drawing = this.createDynamicBatch();
      const relative = this.getRelativeTileOffset(x, y);
      const batch = this.buffers.drawing;
      const layer = this.getCurrentLayer();
      batch.drawTileAt(relative.x, relative.y, getRainbowColor());
      layer.batches.push(this.buffers.drawing);
      layer.updateBoundings();
    }
    else if (this.modes.erase) {
      this.states.erasing = true;
      this.buffers.erasing = this.createDynamicBatch();
      const relative = this.getRelativeTileOffset(x, y);
      const batch = this.buffers.erasing;
      const layer = this.getCurrentLayer();
      batch.isEraser = true;
      batch.erase(relative.x, relative.y);
      layer.batches.push(this.buffers.erasing);
      if (!batch.isEmpty()) layer.updateBoundings();
    }
  }
  else if (e.which === 3) {
    this.states.dragging = true;
    this.click(x, y);
  }
};

/**
 * @param {Event} e
 */
export function onMouseUp(e) {
  e.preventDefault();
  if (e.which === 1) {
    if (this.states.select) {
      this.states.select = false;
      this.states.selecting = false;
    }
    else if (this.states.drawing) {
      const batch = this.buffers.drawing;
      this.states.drawing = false;
      batch.isDynamic = false;
      batch.isRawBuffer = true;
      this.enqueue(CommandKind.DRAW, batch);
      this.buffers.drawing = null;
    }
    else if (this.states.erasing) {
      this.states.erasing = false;
      const batch = this.buffers.erasing;
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.ERASE, batch);
      this.buffers.erasing = null;
    }
  }
  if (e.which === 3) {
    this.states.dragging = false;
  }
};

/**
 * @param {Event} e
 */
export function onMouseMove(e) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  const last = this.last;
  const relative = this.getRelativeTileOffset(x, y);
  this.hover(x, y);
  if (this.states.dragging) {
    this.drag(x, y);
  }
  if (last.mx === relative.x && last.my === relative.y) return;
  if (this.states.selecting) {
    this.selectTo(x, y);
  }
  else if (this.states.drawing) {
    const batch = this.buffers.drawing;
    const layer = this.getCurrentLayer();
    batch.drawTileAt(relative.x, relative.y, getRainbowColor());
    layer.updateBoundings();
  }
  else if (this.states.erasing) {
    const batch = this.buffers.erasing;
    const layer = this.getCurrentLayer();
    batch.erase(relative.x, relative.y);
    if (!batch.isEmpty()) layer.updateBoundings();
  }
  else {
    const relative = this.getRelativeTileOffset(x, y);
    let color = this.getPixelAt(relative.x, relative.y);
    /*if (color) {
      color = rgbaToBytes(color);
      color[3] = 0.1;
      this.buffers.boundingColor = color;
    }*/
  }
  last.mx = relative.x; last.my = relative.y;
};

/**
 * @param {Event} e
 */
export function onKeyDown(e) {
  e.preventDefault();
  const code = e.keyCode;
  this.keys[code] = 1;
  switch (code) {
    // shift
    case 16:
      this.states.select = true;
      this.states.drawing = false;
    break;
    // c | ctrl+c
    case 67:
      if (this.keys[17]) {
        console.log("copy");
      }
    break;
    // z | ctr+z
    case 90:
      if (this.keys[17]) {
        this.undo();
      }
    break;
    // y | ctrl+y
    case 89:
      if (this.keys[17]) {
        this.redo();
      }
    break;
    // f2
    case 113:
      MODES.DEV = !MODES.DEV;
    break;
    // f5
    case 116:
      location.reload();
    break;
  };
};

/**
 * @param {Event} e
 */
export function onKeyUp(e) {
  e.preventDefault();
  const code = e.keyCode;
  this.keys[code] = 0;
  if (code === 16) {
    this.states.select = false;
    this.states.selecting = false;
  }
};

/**
 * @param {Event} e
 */
export function onContextmenu(e) {
  e.preventDefault();
};

/**
 * @param {Event} e
 */
export function onMouseWheel(e) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  const value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
};
