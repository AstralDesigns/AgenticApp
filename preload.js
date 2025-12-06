const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executed. Attaching electronAPI to window...');

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
});