(() => {

  "use strict";

  let canvas = document.createElement("canvas");

  let stage = new Picaxo({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight
  });

  document.body.appendChild(canvas);

  (function draw() {
    stage.clear();
    stage.render();
    requestAnimationFrame(draw);
  })();

  window.stage = stage;

  // ## input events
  let rpressed = false;
  let lpressed = false;
  window.addEventListener("keydown", (e) => {
    switch (e.keyCode) {
      // arrow down
      case 40:
        stage.commander.undo();
      return;
      // arrow up
      case 38:
        stage.commander.redo();
      return;
    };
    //e.preventDefault();
    return;
  });
  window.addEventListener("resize", (e) => {
    stage.resize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("mousemove", (e) => {
    e.preventDefault();
    stage.editor.hover(e.clientX, e.clientY);
    if (lpressed) stage.editor.drag(e.clientX, e.clientY);
    if (!rpressed) return;
    stage.camera.drag(e.clientX, e.clientY);
  });
  window.addEventListener("mousedown", (e) => {
    e.preventDefault();
    // right key to drag
    if (e.which === 3) {
      rpressed = true;
      stage.camera.click(e.clientX, e.clientY);
    }
    // left key to select
    if (e.which === 1) {
      stage.editor.select(e.clientX, e.clientY, true);
      lpressed = true;
    }
  });
  window.addEventListener("mouseup", (e) => {
    e.preventDefault();
    // stop dragging
    if (e.which === 3) {
      rpressed = false;
    }
    // stop selecting
    if (e.which === 1) {
      stage.editor.select(e.clientX, e.clientY, false);
      lpressed = false;
    }
  });
  window.addEventListener("mousewheel", (e) => {
    e.preventDefault();
    let x = e.deltaY > 0 ? -1 : 1;
    stage.camera.click(e.clientX, e.clientY);
    stage.camera.scale(x);
  });
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

})();