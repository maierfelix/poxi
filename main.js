(() => { "use strict";

  // ## relevant part
  let stage = new Picaxo({
    width: window.innerWidth,
    height: window.innerHeight
  });

  stage.on("draw", () => {
    stage.clear();
    stage.render();
  });

  stage.camera.x = (window.innerWidth / 2) | 0;
  stage.camera.y = (window.innerHeight / 2) | 0;

  document.body.appendChild(stage.view); // push view into body

  keyboardJS.bind("ctrl > z", () => {
    stage.editor.undo();
  });
  keyboardJS.bind("ctrl > y", () => {
    stage.editor.redo();
  });

  // ## input events
  let rpressed = false;
  let lpressed = false;
  window.addEventListener("resize", (e) => {
    stage.resize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("mousemove", (e) => {
    let x = e.clientX;
    let y = e.clientY;
    // used to place drag&drop image at mouse position
    window.mx = x;
    window.my = y;
    e.preventDefault();
    stage.editor.hover(x, y);
    // drag before drawing to stay in position (drag+draw)
    if (rpressed) stage.camera.drag(x, y);
    if (lpressed) {
      stage.editor.drawTileAtMouseOffset(x, y);
      let batch = stage.editor.batches[stage.editor.batches.length - 1];
      stage.editor.applyPixelSmoothing(batch);
    }
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
      stage.editor.startBatchedDrawing(e.clientX, e.clientY);
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
      stage.editor.stopBatchedDrawing(e.clientX, e.clientY);
      lpressed = false;
    }
  });
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // chrome
  window.addEventListener("mousewheel", onScroll);
  // ff etc
  window.addEventListener("wheel", onScroll);

  function onScroll(e) {
    e.preventDefault();
    let x = e.deltaY > 0 ? -1 : 1;
    stage.camera.click(e.clientX, e.clientY);
    stage.camera.scale(x);
  };

  // ## drag&drop images
  file.onclick = (e) => { e.preventDefault(); };
  file.onchange = (e) => {
    file.style.display = "none";
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
        stage.editor.drawImage(ctx, window.mx, window.my);
        file.value = ""; // reassign to allow second files
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  // hidy things for drag & drop input
  stage.view.addEventListener("dragenter", (e) => {
    file.style.display = "block";
  });
  file.addEventListener("dragleave", (e) => {
    file.style.display = "none";
  });

  window.stage = stage;

})();