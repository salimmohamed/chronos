import { contextBridge, ipcRenderer } from "electron";

const api = {
  updateTray: (time: string) => ipcRenderer.send("timer:update-tray", time),
  notify: (title: string, body: string) => ipcRenderer.send("timer:notify", title, body),

  loadSessions: () => ipcRenderer.invoke("sessions:load"),
  saveSession: (session: unknown) => ipcRenderer.invoke("sessions:save", session),
  deleteSession: (id: string) => ipcRenderer.invoke("sessions:delete", id),

  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config: unknown) => ipcRenderer.invoke("config:save", config),

  enterFullscreen: () => ipcRenderer.send("window:enter-fullscreen"),
  exitFullscreen: () => ipcRenderer.send("window:exit-fullscreen"),
};

contextBridge.exposeInMainWorld("api", api);
