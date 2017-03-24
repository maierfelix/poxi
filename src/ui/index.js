import {
  hexToRgba,
  rgbaToHex,
  rgbaToBytes
} from "../utils";

export function resetActiveUiButtons() {
  arc.style.removeProperty("opacity");
  move.style.removeProperty("opacity");
  tiled.style.removeProperty("opacity");
  erase.style.removeProperty("opacity");
  bucket.style.removeProperty("opacity");
  select.style.removeProperty("opacity");
  pipette.style.removeProperty("opacity");
  rectangle.style.removeProperty("opacity");
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
    this.states.drawing = false;
    select.style.opacity = 1.0;
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
  color.onchange = (e) => {
    color_view.style.background = color.value;
    this.fillStyle = hexToRgba(color.value);
  };
  color_view.style.background = rgbaToHex(this.fillStyle);

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
        ctx.drawImage(img, 0, 0, img.width, img.height);
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

};
