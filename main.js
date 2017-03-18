const fs = require("fs");
const url = require("url");
const path = require("path");
const buble = require("rollup-plugin-buble");
const rollup = require("rollup");
const electron = require("electron");

const bundleSource = () => {
  return new Promise((resolve, reject) => {
    // rollup import statements and open electron afterwards
    rollup.rollup({
      entry: __dirname + "/src/index.js",
      plugins: [ buble() ],
    }).then((bundle) => {
      const result = bundle.generate({
        format: "cjs"
      });
      fs.writeFileSync("static/bundle.js", result.code);
      resolve();
    }).catch((e) => {
      reject(e);
    });
  });
};

// now open up electron with our fresh rolluped bundle
const initElectron = () => {
  return new Promise((resolve) => {

    const app = electron.app;
    const BrowserWindow = electron.BrowserWindow;

    const createWindow = () => {
      win = new BrowserWindow({
        width: 980,
        height: 680,
        titleBarStyle: "hidden"
      });

      win.loadURL(url.format({
        pathname: path.join(__dirname, "/static/index.html"),
        protocol: "file:",
        slashes: true
      }));
      win.setMenu(null);

      win.webContents.openDevTools();
      win.on("closed", () => {
        win = null;
      });
      resolve({ win, app });
    };

    app.on("ready", createWindow);
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
    app.on("activate", () => {
      if (win === null) createWindow();
    });

  });
};

const initializeStage = () => {
  return new Promise((resolve) => {
    bundleSource().then(() => {
      initElectron().then(resolve);
    }).catch((e) => {
      throw new Error(e);
    });
  });
};

// simple live reload system
initializeStage().then((old) => {
  const onRefresh = (e, file) => {
    // prevent circular tracking
    if (file === "bundle.js") return;
    bundleSource().then(() => {
      old.win.reload();
      old.win.webContents.reloadIgnoringCache();
      old.win.webContents.openDevTools();
      console.log("Refreshed!", "#" + Date.now());
    });
  };
  fs.watch("./src/", {recursive: true}, onRefresh);
  fs.watch("./static/", {recursive: true}, onRefresh);
});
