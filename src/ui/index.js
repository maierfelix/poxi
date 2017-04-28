import {
  hexToRgba,
  rgbaToHex,
  rgbaToBytes
} from "../color";

import Layer from "../layer/index";
import CommandKind from "../stack/kind";

export function resetModes() {
  for (let key in this.modes) {
    this.resetSelection();
    this.modes[key] = false;
  };
  this.resetActiveUiButtons();
};

export function resetActiveUiButtons() {
  arc.style.removeProperty("opacity");
  move.style.removeProperty("opacity");
  shape.style.removeProperty("opacity");
  tiled.style.removeProperty("opacity");
  erase.style.removeProperty("opacity");
  bucket.style.removeProperty("opacity");
  select.style.removeProperty("opacity");
  stroke.style.removeProperty("opacity");
  pipette.style.removeProperty("opacity");
  lighting.style.removeProperty("opacity");
  rectangle.style.removeProperty("opacity");
  paint_all.style.removeProperty("opacity");
};

/**
 * @return {Void}
 */
export function setUiColor(value) {
  // close fast color picker menu
  if (this.states.fastColorMenu) {
    this.closeFastColorPickerMenu();
  }
  color_hex.innerHTML = String(value).toUpperCase();
  color_view.style.background = value;
  const rgba = hexToRgba(value);
  // prevent changing color if it didnt changed
  if (
    this.fillStyle[0] === rgba[0] &&
    this.fillStyle[1] === rgba[1] &&
    this.fillStyle[2] === rgba[2] &&
    this.fillStyle[3] === rgba[3]
  ) return;
  this.fillStyle = rgba;
  this.addCustomColor(rgba);
  return;
};

/**
 * @param {Array} rgba
 */
export function addCustomColor(rgba) {
  const colors = this.favoriteColors;
  let count = 0;
  for (let ii = 0; ii < colors.length; ++ii) {
    const color = colors[ii].color;
    const index = colors[ii].index;
    // color already saved, increase it's importance
    if (
      color[0] === rgba[0] &&
      color[1] === rgba[1] &&
      color[2] === rgba[2] &&
      color[3] === rgba[3]
    ) {
      colors[ii].index += 1;
      count++;
      //console.log("Found!", color, rgba);
    }
  };
  // color isn't saved yet
  if (count <= 0) {
    // color limit exceeded, replace less used color with this one
    if (colors.length >= 16) {
      colors[colors.length - 1].color = color;
      colors[colors.length - 1].index += 1;
    } else {
      // we have to replace the less used color
      colors.push({
        color: rgba,
        index: 0
      });
    }
  }
  // resort descending by most used color
  colors.sort((a, b) => { return (b.index - a.index); });
  // sync with storage
  this.writeStorage("favorite_colors", JSON.stringify(colors));
  // sync color menu with favorite colors
  this.updateFastColorPickMenu();
};

export function closeFastColorPickerMenu() {
  menu.style.visibility = "hidden";
  this.states.fastColorMenu = false;
};

export function openFastColorPickerMenu() {
  menu.style.visibility = "visible";
  this.states.fastColorMenu = true;
};

export function updateFastColorPickMenu() {
  // first remove all color nodes
  for (let ii = 0; ii < 16; ++ii) {
    const node = colors.children[0];
    if (!node) continue;
    node.parentNode.removeChild(node);
  };
  // now re-insert the updated ones
  for (let ii = 0; ii < 16; ++ii) {
    const color = this.favoriteColors[ii];
    const node = document.createElement("div");
    if (color) {
      node.setAttribute("color", "[" + color.color + "]");
      node.style.background = rgbaToHex(color.color);
    } else {
      node.setAttribute("color", "[0,0,0,1]");
      node.style.background = "#000000";
    }
    colors.appendChild(node);
  };
};

/**
 * @param {HTMLElement} e
 * @param {Boolean} dbl
 */
export function clickedLayer(e, dbl) {
  const el = e.target;
  const kind = el.classList.value;
  const parent = (
    kind !== "layer-item" ? el.parentNode : el
  );
  const layer = this.getLayerByNode(parent);
  if (layer === null) return;
  switch (kind) {
    // clicked on layer, set it active
    case "layer-text":
      if (!dbl) {
        this.setActiveLayer(layer);
      }
      else {
        el.removeAttribute("readonly");
        el.focus();
        el.onkeypress = (e) => {
          const code = (e.keyCode ? e.keyCode : e.which);
          if (code === 13) el.blur();
        };
        el.onblur = () => {
          const oname = layer.name;
          if (!el.value) {
            layer.name = oname;
          } else {
            if (String(oname) !== el.value) {
              this.enqueue(CommandKind.LAYER_RENAME, {
                oname, name: el.value, layer: layer
              });
            }
          }
          el.setAttribute("readonly", "readonly");
        };
      }
    break;
    // clicked a layer icon
    case "layer-item-visible":
      this.enqueue(CommandKind.LAYER_VISIBILITY, {
        layer: layer
      });
    break;
    // clicked lock icon
    case "layer-item-locked":
      this.enqueue(CommandKind.LAYER_LOCK, {
        layer: layer
      });
    break;
  };
};

export function setupUi() {

  // ui
  tiled.onclick = (e) => {
    this.resetModes();
    this.modes.draw = true;
    tiled.style.opacity = 1.0;
  };
  erase.onclick = (e) => {
    this.resetModes();
    this.modes.erase = true;
    erase.style.opacity = 1.0;
  };
  bucket.onclick = (e) => {
    this.resetModes();
    this.modes.fill = true;
    bucket.style.opacity = 1.0;
  };
  pipette.onclick = (e) => {
    this.resetModes();
    this.modes.pipette = true;
    pipette.style.opacity = 1.0;
  };
  select.onclick = (e) => {
    this.resetModes();
    this.modes.select = true;
    select.style.opacity = 1.0;
  };
  stroke.onclick = (e) => {
    this.resetModes();
    this.modes.stroke = true;
    stroke.style.opacity = 1.0;
  };
  arc.onclick = (e) => {
    this.resetModes();
    this.modes.arc = true;
    arc.style.opacity = 1.0;
  };
  rectangle.onclick = (e) => {
    this.resetModes();
    this.modes.rect = true;
    rectangle.style.opacity = 1.0;
  };
  paint_all.onclick = (e) => {
    this.resetModes();
    this.modes.flood = true;
    paint_all.style.opacity = 1.0;
  };
  shape.onclick = (e) => {
    this.resetModes();
    this.modes.shape = true;
    shape.style.opacity = 1.0;
  };
  lighting.onclick = (e) => {
    this.resetModes();
    this.modes.light = true;
    lighting.style.opacity = 1.0;
  };
  move.onclick = (e) => {
    this.resetModes();
    this.modes.move = true;
    move.style.opacity = 1.0;
  };
  color.onchange = (e) => {
    this.setUiColor(color.value);
  };

  undo.onclick = (e) => {
    this.undo();
  };
  redo.onclick = (e) => {
    this.redo();
  };

  download.onclick = (e) => {
    const link = document.createElement("a");
    const data = this.exportAsDataUrl();
    link.href = data;
    link.download = 655321 + ".png";
    link.click();
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
        ctx.drawImage(
          img,
          0, 0,
          img.width, img.height,
          0, 0,
          img.width, img.height
        );
        this.insertImage(ctx, this.last.mx, this.last.my);
        file.value = ""; // reassign to allow second files
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  // hidy things for drag & drop input
  this.view.addEventListener("dragenter", (e) => {
    file.style.display = "block";
  });
  file.addEventListener("dragleave", (e) => {
    file.style.display = "none";
  });

  layers.addEventListener("click", (e) => this.clickedLayer(e, false));
  layers.addEventListener("dblclick", (e) => this.clickedLayer(e, true));

  add_layer.onclick = (e) => {
    const layer = this.getCurrentLayer();
    let index = layer ? layer.getIndex() : 0;
    index = index < 0 ? 0 : index;
    this.enqueue(CommandKind.LAYER_ADD, {
      layer: new Layer(this), index
    });
  };
  remove_layer.onclick = (e) => {
    const layer = this.getCurrentLayer();
    let index = layer ? layer.getIndex() : 0;
    index = index < 0 ? 0 : index;
    if (layer !== null) this.enqueue(CommandKind.LAYER_REMOVE, {
      layer, index
    });
    this.redraw = true;
  };

  move_layer_up.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null && layer.getIndex() > 0) {
      this.enqueue(CommandKind.LAYER_ORDER, {
        layer, index: layer.getIndex() - 1, oindex: layer.getIndex()
      });
    }
    this.redraw = true;
  };
  move_layer_down.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null && layer.getIndex() < this.layers.length - 1) {
      this.enqueue(CommandKind.LAYER_ORDER, {
        layer, index: layer.getIndex() + 1, oindex: layer.getIndex()
      });
    }
    this.redraw = true;
  };

  clone.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      let index = layer ? layer.getIndex() : 0;
      index = index < 0 ? 0 : index;
      this.enqueue(CommandKind.LAYER_CLONE, {
        layer: layer.clone(), index
      });
    }
  };

  clone_by_ref.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      let index = layer ? layer.getIndex() : 0;
      index = index < 0 ? 0 : index;
      this.enqueue(CommandKind.LAYER_CLONE_REF, {
        layer: layer.cloneByReference(), index
      });
    }
  };

  flip_horizontal.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      this.enqueue(CommandKind.LAYER_FLIP_HORIZONTAL, { layer });
    }
  };
  flip_vertical.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      this.enqueue(CommandKind.LAYER_FLIP_VERTICAL, { layer });
    }
  };

  rotate_right.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      this.enqueue(CommandKind.LAYER_ROTATE_RIGHT, { layer });
    }
  };
  rotate_left.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null) {
      this.enqueue(CommandKind.LAYER_ROTATE_LEFT, { layer });
    }
  };

  merge.onclick = (e) => {
    const layer = this.getCurrentLayer();
    if (layer !== null && this.layers.length > 1) {
      if (layer.getIndex() < this.layers.length - 1) {
        const merge = this.getLayerByIndex(layer.getIndex() + 1);
        const data = merge.mergeWithLayer(layer);
        this.enqueue(CommandKind.LAYER_MERGE, { data, layer, index: layer.getIndex() });
      }
    }
  };

  this.modes.draw = true;
  tiled.style.opacity = 1.0;

  // setup ui list button states
  this.processUIClick(document.querySelector("#light-size").children[0]);
  this.processUIClick(document.querySelector("#eraser-size").children[0]);
  this.processUIClick(document.querySelector("#pencil-size").children[0]);

};
