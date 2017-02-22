(() => {

  "use strict";

  // ## drag&drop images
  let el = document.createElement("input");
  el.style = `
    width: 100%; height: 100%; opacity: 0; position: absolute; left: 0px; top: 0px; z-index: 999;
  `;
  el.setAttribute("type", "file");
  el.onclick = (e) => { e.preventDefault(); };
  el.setAttribute("title", " "); // invisible
  el.onchange = (e) => {
    let reader = new FileReader();
    reader.onload = (e) => {
      if (e.target.result.slice(11, 14) !== "png") {
        throw new Error("Invalid image type!");
      }
      let img = new Image();
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        stage.insertSpriteContextAt(ctx, mx, my);
        el.value = ""; // reassign to allow second files
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  document.body.appendChild(el);

  // ## relevant part
  let stage = new Picaxo({
    width: window.innerWidth,
    height: window.innerHeight
  });
  document.body.appendChild(stage.view); // push view into body

  stage.on("draw", () => {
    stage.clear();
    stage.render();
  });

  stage.view.addEventListener("dragover", (e) => {
    console.log(e);
  });

  window.stage = stage;

  keyboardJS.bind("ctrl > z", () => {
    stage.editor.undo();
  });
  keyboardJS.bind("ctrl > y", () => {
    stage.editor.redo();
  });
  stage.on("windowresize", () => {

  });
  stage.on("mousescroll", () => {

  });

  // current mouse position
  let mx = 0;
  let my = 0;

  // ## input events
  let rpressed = false;
  let lpressed = false;
  window.addEventListener("resize", (e) => {
    stage.resize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    e.preventDefault();
    stage.editor.hover(mx, my);
    // drag before drawing to stay in position (drag+draw)
    if (rpressed) stage.camera.drag(mx, my);
    if (lpressed) stage.editor.drawTileAtMouseOffset(mx, my);
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