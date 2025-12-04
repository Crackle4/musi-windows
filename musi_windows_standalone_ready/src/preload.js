const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePlaylist: (id, name, tracksJson) => ipcRenderer.invoke('save-playlist', id, name, tracksJson),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  deletePlaylist: (id) => ipcRenderer.invoke('delete-playlist', id),
  pickFiles: () => ipcRenderer.invoke('pick-files')
});
