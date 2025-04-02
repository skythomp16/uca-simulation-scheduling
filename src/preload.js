// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileChooser: (selectDirectory) => ipcRenderer.invoke('open-file-chooser', selectDirectory),
    readExcelFiles: (dir) => ipcRenderer.invoke('read-excel-files', dir),
    writeExcelFile: (dir, data) => ipcRenderer.invoke('write-excel-file', dir, data)
});