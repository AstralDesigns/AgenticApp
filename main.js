const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the Angular app. In development, this will be from the dev server.
  // In production, this will be from the built file.
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/agentic-studio/browser/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler for reading a directory
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const resolvedPath = dirPath === '~' ? os.homedir() : dirPath;
    const items = await fs.readdir(resolvedPath, { withFileTypes: true });
    return items.map(item => ({
      name: item.name,
      path: path.join(resolvedPath, item.name),
      type: item.isDirectory() ? 'folder' : 'file',
    }));
  } catch (error) {
    console.error('Failed to read directory:', error);
    return { error: error.message };
  }
});

// IPC handler for reading a file
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { content };
    } catch (error) {
        console.error('Failed to read file:', error);
        return { error: error.message };
    }
});
