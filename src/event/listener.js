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
    // debug helper
    (() => {
      const relative = this.getRelativeTileOffset(x, y);
      console.log(relative.x, relative.y);
    })();
    if (this.states.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else {
      this.states.drawing = true;
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
      this.sx = this.sy = 0;
      this.sw = this.sh = -0;
      this.states.select = false;
      this.states.selecting = false;
    }
    else if (this.states.drawing) {
      this.states.drawing = false;
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
  this.hover(x, y);
  if (this.states.selecting) {
    this.selectTo(x, y);
  }
  else if (this.states.drawing) {
    const relative = this.getRelativeTileOffset(x, y);
    this.drawTileAt(relative.x, relative.y);
  }
  if (this.states.dragging) {
    this.drag(x, y);
  }
};

/**
 * @param {Event} e
 */
export function onKeyDown(e) {
  const code = e.keyCode;
  // shift
  if (code === 16) {
    this.states.select = true;
  }
  else if (code === 116) location.reload();
};

/**
 * @param {Event} e
 */
export function onKeyUp(e) {
  const code = e.keyCode;
  if (code === 16) {
    this.states.select = false;
    this.states.selecting = false;
    this.sx = this.sy = 0;
    this.sw = this.sh = -0;
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
