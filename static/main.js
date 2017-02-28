(() => { "use strict";

  // ## relevant part
  let stage = new Poxi({
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

  stage.editor.strokeRect(0, 0, 12, 12, [45, 67, 154, 1]);
  stage.editor.fillBucket(2, 2, [64, 64, 48, 1]);

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
    if (lpressed && modes.tiled) {
      stage.editor.drawTileAtMouseOffset(x, y);
      let batch = stage.editor.batches[stage.editor.batches.length - 1];
      stage.editor.applyPixelSmoothing(batch);
    }
    else if (modes.rectangle && modes.rectangleStart) {
      let batch = stage.editor.getLatestTileBatchOperation();
      batch.tiles = [];
      batch.buffer = null;
      batch.isBuffered = false;
      let start = stage.editor.getRelativeOffset(rectX, rectY);
      let end = stage.editor.getRelativeOffset(x, y);
      stage.editor.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y, stage.editor.fillStyle);
    }
  });
  window.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (!(e.target instanceof HTMLCanvasElement)) return;
    // right key to drag
    if (e.which === 3) {
      rpressed = true;
      stage.camera.click(e.clientX, e.clientY);
    }
    // left key to select
    if (e.which === 1) {
      if (modes.tiled) {
        stage.editor.startBatchedDrawing(e.clientX, e.clientY);
        lpressed = true;
      }
      else if (modes.bucket) {
        let relative = stage.editor.getRelativeOffset(e.clientX, e.clientY);
        stage.editor.fillBucket(relative.x, relative.y, stage.editor.fillStyle);
      }
      else if (modes.rectangle) {
        rectX = e.clientX;
        rectY = e.clientY;
        modes.rectangleStart = true;
      }
    }
  });
  window.addEventListener("mouseup", (e) => {
    e.preventDefault();
    if (!(e.target instanceof HTMLCanvasElement)) return;
    // stop dragging
    if (e.which === 3) {
      rpressed = false;
    }
    // stop selecting
    if (e.which === 1) {
      if (modes.tiled) {
        stage.editor.stopBatchedDrawing(e.clientX, e.clientY);
        lpressed = false;
      }
      else if (modes.rectangle) {
        modes.rectangleStart = false;
      }
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

  // color picker
  color.onchange = (e) => {
    stage.editor.fillStyle = color.value;
  };
  // auto set initial color
  stage.editor.fillStyle = color.value;

  // download button
  download.onclick = () => {
    let data = stage.exportAsDataUrl();
    window.open(data);
  };

  let modes = {
    bucket: false,
    tiled: false,
    rectangle: false,
    rectangleStart: false,
    ellipse: false,
    ellipseStart: false
  };
  let rectX = 0;
  let rectY = 0;

  // buttons
  bucket.onclick = () => {
    resetModes();
    modes.bucket = true;
  };
  tiled.onclick = () => {
    resetModes();
    modes.tiled = true;
  };
  rectangle.onclick = () => {
    resetModes();
    modes.rectangle = true;
  };
  ellipse.onclick = () => {
    resetModes();
    modes.ellipse = true;
  };
  modes.tiled = true;

  let resetModes = () => {
    for (let key in modes) {
      modes[key] = false;
    };
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

  window.stage = stage; // our current stage

})();