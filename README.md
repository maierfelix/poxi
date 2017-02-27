<div align="center">
  <h3>
    Poxi is a modern, hackable pixel art editor for the browser with focus on elegance, simplicity and productivity.
  </h3>
</div>

<div align="center">
  <a href="http://maierfelix.github.io/poxi/">Demo</a>
  <br/><br/>
  <a href="https://github.com/maierfelix/poxi/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/BSD2-License-blue.svg?style=flat-square" alt="BSD-2" />
  </a>
  <a href="https://github.com/maierfelix/poxi/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/Dependencies-None-green.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square" alt="Stability" />
  </a>
</div>

### Introduction
You can either use Poxi as a pixel art editor or as a renderer for your games (see [API](https://github.com/maierfelix/poxi#api)). Poxi offers **great** performance, an infinite grid playground as well as a wide range of fine grained api methods.

 - Auto batch and buffer based drawing
 - Undo/Redo for all operations
 - Infinite grid in all directions
 - Import images // *Use drag n' drop in the demo*

### Coming soon:
 - Layers
 - Animations
 - Eraser (Delete tiles)
 - Cropper (Crop out and move areas)

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
If you're interested in creating a **pixel art editor ui** for this project, then please write me a [mail](mailto:xilefmai@gmail.com) first.

Code related pull requests are very welcome, but please make sure they match the existing code style.

### License
[BSD-2](https://github.com/maierfelix/poxi/blob/master/LICENSE)
