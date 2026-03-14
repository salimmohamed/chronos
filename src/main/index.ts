import * as path from "node:path";
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  screen,
  Tray,
} from "electron";
import { deleteSession, readConfig, readSessions, saveSession, writeConfig } from "./storage";

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const NORMAL_WIDTH = 400;
const NORMAL_HEIGHT = 600;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: NORMAL_WIDTH,
    height: NORMAL_HEIGHT,
    resizable: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.once("ready-to-show", () => win.show());

  return win;
}

function showOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.size;

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    backgroundColor: "#0a0a0a",
    hasShadow: false,
    enableLargerThanScreen: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    focusable: true,
    titleBarStyle: "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true);

  // Load the same renderer — it will check for overlay mode via IPC
  if (process.env.ELECTRON_RENDERER_URL) {
    overlayWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}?overlay=true`);
  } else {
    overlayWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
      query: { overlay: "true" },
    });
  }

  // Hide main window so only the overlay is visible
  mainWindow?.hide();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function closeOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
}

function createTray(): Tray {
  const icon = nativeImage.createEmpty();
  const t = new Tray(icon);
  t.setTitle("chronos");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => mainWindow?.show() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
  t.setContextMenu(contextMenu);

  t.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });

  return t;
}

function registerIPC(): void {
  ipcMain.on("timer:update-tray", (_, time: string) => {
    tray?.setTitle(time);
  });

  ipcMain.on("timer:notify", (_, title: string, body: string) => {
    new Notification({ title, body }).show();
  });

  ipcMain.handle("sessions:load", () => readSessions());
  ipcMain.handle("sessions:save", (_, session) => saveSession(session));
  ipcMain.handle("sessions:delete", (_, id: string) => deleteSession(id));

  ipcMain.handle("config:load", () => readConfig());
  ipcMain.handle("config:save", (_, config) => writeConfig(config));

  ipcMain.on("window:enter-fullscreen", () => showOverlay());
  ipcMain.on("window:exit-fullscreen", () => closeOverlay());
}

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  tray = createTray();
  registerIPC();

  globalShortcut.register("CommandOrControl+Shift+T", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
  } else if (!overlayWindow) {
    mainWindow.show();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
