import * as path from "node:path";
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  Tray,
} from "electron";
import { deleteSession, readConfig, readSessions, saveSession, writeConfig } from "./storage";

let mainWindow: BrowserWindow | null = null;
let breakWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
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
    win.loadFile(path.join(__dirname, "../renderer/main/index.html"));
  }

  win.once("ready-to-show", () => win.show());

  return win;
}

function createBreakWindow(duration: number): BrowserWindow {
  const win = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    backgroundColor: "#0a0a0a",
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/break.html?duration=${duration}`);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/break/index.html"), {
      query: { duration: String(duration) },
    });
  }

  return win;
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

  ipcMain.on("break:start", (_, duration: number) => {
    if (breakWindow) {
      breakWindow.close();
    }
    breakWindow = createBreakWindow(duration);
  });

  ipcMain.on("break:end", () => {
    if (breakWindow) {
      breakWindow.close();
      breakWindow = null;
    }
  });

  ipcMain.on("break:dismiss", () => {
    if (breakWindow) {
      breakWindow.close();
      breakWindow = null;
    }
    mainWindow?.webContents.send("break:dismissed");
  });
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
  if (!mainWindow) {
    mainWindow = createMainWindow();
  } else {
    mainWindow.show();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
