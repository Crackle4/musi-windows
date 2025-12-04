const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let dbPath = path.join(app.getPath('userData'), 'playlists.db');
let db;

function initDB() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS playlists (id TEXT PRIMARY KEY, name TEXT, tracks TEXT)`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  initDB();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('save-playlist', async (event, id, name, tracksJson) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO playlists (id, name, tracks) VALUES (?, ?, ?)`, [id, name, tracksJson], function(err) {
      if (err) reject(err.message); else resolve(true);
    });
  });
});

ipcMain.handle('load-playlists', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name, tracks FROM playlists`, [], (err, rows) => {
      if (err) reject(err.message); else resolve(rows);
    });
  });
});

ipcMain.handle('delete-playlist', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM playlists WHERE id = ?`, [id], function(err) {
      if (err) reject(err.message); else resolve(true);
    });
  });
});

ipcMain.handle('pick-files', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: 'Audio', extensions: ['mp3','wav','m4a','aac'] }] });
  return res.filePaths || [];
});
