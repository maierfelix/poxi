<div align="center">
  <h3>
    Poxi is a modern, flat pixel art editor for the browser with focus on elegance, simplicity and productivity.
  </h3>
</div>

<div align="center">
  <a href="http://maierfelix.github.io/poxi/">Demo</a>
  <br/><br/>
  <a href="https://github.com/maierfelix/poxi/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/BSD2-License-blue.svg?style=flat-square" alt="BSD-2" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Renderer-WebGL-red.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Dependencies-None-green.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/Stability-experimental-orange.svg?style=flat-square" alt="Stability" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/🦄-Compatible-ff69b4.svg?style=flat-square" alt="Woot Woot!" />
  </a>
</div>

### Core features
 - Smart batching
 - WebGL based renderer
 - Undo/Redo for all operations
 - Infinite grid
 - Import images // *Use drag n' drop in the demo*

### Coming soon
 - Animations
 - Moving tool

### API
  - drawImage (ctx, x, y)
  - fillRect (x, y, width, height, color)
  - strokeRect (x, y, width, height, color)
  - fillArc (x, y, radius, color)
  - strokeArc (x, y, radius, color)
  - fillBucket (x, y, color)
  - applyColorLightness (batch, +-factor)
  - applyPixelSmoothing (batch)
  - exportAsDataUrl() => String

### Contributing

Code related pull requests are very welcome, but please make sure they match the existing *super weird* code style.

### License
[BSD-2](https://github.com/maierfelix/poxi/blob/master/LICENSE)