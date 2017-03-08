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
  stage.camera.scale(6); // zoom a bit

  document.body.appendChild(stage.view); // push view into body

  keyboardJS.bind("ctrl > z", (e) => {
    e.preventDefault();
    stage.editor.undo();
  });
  keyboardJS.bind("ctrl > y", (e) => {
    e.preventDefault();
    stage.editor.redo();
  });

  // dropdown
  let menuActive = false;
  let closeActiveMenu = () => {
    menu.style.display = "none";
    menuActive = false;
  };
  (() => {
    keyboardJS.bind("space", (e) => {
      e.preventDefault();
      // close
      if (menuActive) {
        closeActiveMenu();
        return;
      }
      menuActive = true;
      let mx = window.mx;
      let my = window.my;
      menu.style.display = "block";
      menu.style.left = mx + "px";
      menu.style.top = my + "px";
    });
  })();

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
    window.mx = x;
    window.my = y;
    if (menuActive) return;
    if (!(e.target instanceof HTMLCanvasElement)) return;
    mouseIsOut = false;
    e.preventDefault();
    stage.editor.hover(x, y);
    // drag before drawing to stay in position (drag+draw)
    if (rpressed) stage.camera.drag(x, y);
    if (lpressed && modes.tiled) {
      stage.editor.drawTileAtMouseOffset(x, y);
      let batch = stage.editor.batches[stage.editor.batches.length - 1];
      if (beautiful) stage.editor.applyPixelSmoothing(batch);
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
    e.stopPropagation();
    if (menuActive) {
      if (e.target instanceof HTMLCanvasElement) {
        closeActiveMenu();
      }
      else return;
    }
    if (!(e.target instanceof HTMLCanvasElement)) return;
    // right key to drag
    if (e.which === 3) {
      rpressed = true;
      stage.camera.click(e.clientX, e.clientY);
    }
    // left key to select
    if (e.which === 1) {
      cursors.style.opacity = 0.5;
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
      else if (modes.pipette) {
        let color = stage.getColorAtMouseOffset(e.clientX, e.clientY);
        if (color !== null) colorChange({value:color});
      }
    }
  });
  window.addEventListener("mouseup", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuActive) return;
    if (!(e.target instanceof HTMLCanvasElement)) return;
    cursors.style.opacity = 0.75;
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
      else if (modes.pipette) {
        resetModes();
        modes[lastMode] = true;
        setActiveCursor(lastMode);
      }
    }
  });
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuActive) {
      if (e.target instanceof HTMLCanvasElement) {
        closeActiveMenu();
      }
    }
  });

  // chrome
  window.addEventListener("mousewheel", onScroll);
  // ff etc
  window.addEventListener("wheel", onScroll);

  function onScroll(e) {
    e.preventDefault();
    if (menuActive) return;
    let x = e.deltaY > 0 ? -1 : 1;
    stage.camera.click(e.clientX, e.clientY);
    stage.camera.scale(x);
  };

  let mouseIsOut = false;
  let onMouseOut = () => {
    stage.editor.mx = -0;
    stage.editor.my = -0;
    mouseIsOut = true;
    lastMode = getActiveMode();
    resetCursors();
  };

  // handle mouse outside window
  stage.view.addEventListener("mouseout", onMouseOut);
  stage.view.addEventListener("mouseleave", onMouseOut);

  let changeFillColor = (color) => {
    stage.editor.fillStyle = color;
    color_view.style.background = color;
  };

  let colorChange = (e) => {
    changeFillColor(e.value);
    closeActiveMenu();
  };
  // color picker
  color.onchange = (e) => colorChange(color);
  // auto set initial color
  colorChange({ value: color.value });
  stage.editor.fillStyle = color.value;

  // download button
  download.onclick = () => {
    closeActiveMenu();
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
  let lastMode = "tiled";
  let rectX = 0;
  let rectY = 0;

  // buttons
  bucket.onclick = () => {
    resetModes();
    modes.bucket = true;
    setActiveCursor("bucket");
    closeActiveMenu();
  };
  tiled.onclick = () => {
    resetModes();
    modes.tiled = true;
    setActiveCursor("tiled");
    closeActiveMenu();
  };
  pipette.onclick = () => {
    // save last mode
    let mode = getActiveMode();
    if (mode !== "pipette") lastMode = mode;
    resetModes();
    modes.pipette = true;
    setActiveCursor("pipette");
    closeActiveMenu();
  };
  /*rectangle.onclick = () => {
    resetModes();
    modes.rectangle = true;
  };
  ellipse.onclick = () => {
    resetModes();
    modes.ellipse = true;
  };*/

  let beautiful = false;
  beautify.onclick = () => {
    beautiful = !beautiful;
    beautify.style.opacity = beautiful ? 1.0 : 0.295;
  };

  let resetModes = () => {
    for (let key in modes) {
      modes[key] = false;
    };
  };
  let getActiveMode = () => {
    for (let key in modes) {
      if (modes[key]) return (key);
    };
  };

  let resetCursors = () => {
    let children = cursors.children;
    for (let key in children) {
      if (children[key] instanceof HTMLElement) {
        children[key].style.display = "none";
      }
    };
  };
  let setActiveCursor = (kind) => {
    let el = document.querySelector("#c" + kind);
    resetCursors();
    el.style.display = "block";
  };
  window.addEventListener("mousemove", (e) => {
    let cursor = getActiveMode();
    let el = document.querySelector("#c" + cursor);
    if (!el) return;
    if (mouseIsOut) {
      resetCursors();
    } else {
      setActiveCursor(cursor);
    }
    el.style.left = e.clientX + 11 + "px";
    el.style.top = e.clientY + 14 + "px";
  });
  modes.tiled = true;
  setActiveCursor("tiled");

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