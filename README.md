<div align="center">
  <h3>
    Picaxo is a modern, hackable pixel art editor for the browser with focus on elegance, simplicity and productivity.
  </h3>
</div>

<div align="center">
  <a href="http://maierfelix.github.io/picaxo/">Demo</a>
  <br/><br/>
  <a href="https://github.com/maierfelix/picaxo/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/BSD2-License-blue.svg?style=flat-square" alt="BSD-2" />
  </a>
  <a href="https://github.com/maierfelix/picaxo/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/Dependencies-None-green.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square" alt="Stability" />
  </a>
</div>

### Introduction
You can either use Picaxo as a pixel art editor or as a renderer for your games (see [API](https://github.com/maierfelix/picaxo#api)). Picaxo offers great performance, an infinite grid playground as well as a wide range of fine grained api methods.

 - Batch and buffer based tile drawing
 - Undo/Redo for all operations
 - Infinite grid in all directions
 - Import images

### Coming soon:
 - Layers
 - Animations
 - Eraser (Delete tiles)
 - Cropper (Crop out or move pixel regions)

### API:
  - drawImage (ctx, x, y)
  - fillRect (x, y, width, height, color)
  - strokeRect (x, y, width, height, color)
  - fillArc (x, y, radius, color) // left
  - strokeArc (x, y, radius, color)
  - fillBucket (x, y, color)
  - applyColorLightness (batch, +-factor)
  - applyPixelSmoothing (batch)
  - getRandomRgbaColors () => Array

### Contributing
If you're interested and experienced in creating a **pixel art editor ui**, then feel free to write me a [mail](xilefmai@gmail.com). Pull requests are welcome as long as they match the given code style.

### License
[BSD-2](https://github.com/maierfelix/picaxo/blob/master/LICENSE)