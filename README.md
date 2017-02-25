<div align="center">
  <h3>
    Picaxo is a modern, hackable pixel art editor for the browser with focus on elegance, simplicity and productivity.
  </h3>
</div>

<div align="center">

  [Demo](http://maierfelix.github.io/picaxo/)

  <a href="https://github.com/maierfelix/picaxo/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/BSD2-License-blue.svg?style=flat-square" alt="BSD-2" />
  </a>
  <a href="https://github.com/maierfelix/picaxo/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/Dependencies-None-green.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-unstable-orange.svg?style=flat-square" alt="Stability" />
  </a>
</div>

### Coming soon:
 - Layers
 - Animations
 - Ellipse insertion
 - Eraser (Delete tiles)
 - Bucket (Fill enclosed tile area)
 - Dropper (Extract tile color)
 - Cropper (Crop out tile area)

### API:
  - drawImage (ctx, x, y)
  - strokeRect (x, y, width, height, color)
  - fillRect (x, y, width, height, color)
  - applyColorLightness (batch, factor)
  - applyPixelSmoothing (batch)
  - getRandomRgbaColors () => Array

### License
[BSD-2](https://github.com/maierfelix/picaxo/blob/master/LICENSE)