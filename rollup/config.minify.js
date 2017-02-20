import fs from "fs";
import buble from "rollup-plugin-buble";
import uglify from "rollup-plugin-uglify";

let name = require("../package.json").name;

export default {
  entry: "src/index.js",
  moduleName: name,
  plugins: [ buble(), uglify() ],
  targets: [
    { dest: `dist/${name}.min.js`, format: "umd" }
  ]
};