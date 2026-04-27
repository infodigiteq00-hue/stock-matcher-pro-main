const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const API_PORT = Number(process.env.INVENTORY_API_PORT || 4000);
const isDev = !app.isPackaged;

let mainWindow;
let serverModule;

const ensureDataFiles = () => {
  const targetDataDir = path.join(app.getPath("userData"), "data");
  const sourceDataDir = isDev
    ? path.resolve(__dirname, "..", "..", "backend", "data")
    : path.join(process.resourcesPath, "data-seed");

  fs.mkdirSync(targetDataDir, { recursive: true });

  for (const fileName of ["inventory-data.json", "admin-data.json"]) {
    const targetPath = path.join(targetDataDir, fileName);
    if (fs.existsSync(targetPath)) {
      continue;
    }

    const sourcePath = path.join(sourceDataDir, fileName);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      continue;
    }

    fs.writeFileSync(targetPath, "{}", "utf8");
  }

  process.env.INVENTORY_DATA_DIR = targetDataDir;
};

const getBackendServerModule = () => {
  if (isDev) {
    return require(path.resolve(__dirname, "..", "..", "backend", "src", "server.js"));
  }

  return require(path.join(app.getAppPath(), "backend", "src", "server.js"));
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
    return;
  }

  mainWindow.loadURL(`http://127.0.0.1:${API_PORT}`);
};

const startApp = async () => {
  ensureDataFiles();
  process.env.ELECTRON_RENDERER_DIST = path.join(app.getAppPath(), "dist");
  process.env.INVENTORY_API_PORT = String(API_PORT);

  serverModule = getBackendServerModule();
  serverModule.startServer(API_PORT);
  createWindow();
};

app.whenReady().then(startApp);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  if (serverModule?.stopServer) {
    await serverModule.stopServer();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
