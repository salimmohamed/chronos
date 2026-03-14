import { contextBridge, ipcRenderer } from "electron";

const api = {
  updateTray: (time: string) => ipcRenderer.send("timer:update-tray", time),
  notify: (title: string, body: string) => ipcRenderer.send("timer:notify", title, body),

  loadSessions: () => ipcRenderer.invoke("sessions:load"),
  saveSession: (session: unknown) => ipcRenderer.invoke("sessions:save", session),
  deleteSession: (id: string) => ipcRenderer.invoke("sessions:delete", id),

  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config: unknown) => ipcRenderer.invoke("config:save", config),

  startBreak: (duration: number) => ipcRenderer.send("break:start", duration),
  endBreak: () => ipcRenderer.send("break:end"),
  dismissBreak: () => ipcRenderer.send("break:dismiss"),

  onBreakDismissed: (cb: () => void) => {
    ipcRenderer.on("break:dismissed", cb);
    return () => ipcRenderer.removeListener("break:dismissed", cb);
  },
};

contextBridge.exposeInMainWorld("api", api);
