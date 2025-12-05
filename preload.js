const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
});
