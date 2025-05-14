// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'), // Example if you want to invoke
  onAppVersion: (callback) => ipcRenderer.on('app-version', (_event, value) => callback(value)),
  checkForUpdate: () => ipcRenderer.send('check-for-update'),
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (_event, value) => callback(value))
});