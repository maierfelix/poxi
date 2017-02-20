import fs from "fs";
import buble from "rollup-plugin-buble";

let name = require("../package.json").name;

export default {
  entry: "src/index.js",
  moduleName: name,
  plugins: [ buble() ],
  targets: [
    { dest: `dist/${name}.js`, format: "umd" }
  ]
};