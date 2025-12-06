const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Disable hardware acceleration to prevent GPU issues on some systems
app.disableHardwareAcceleration();

const isDev = !app.isPackaged;

// Enable live reload for Electron development
if (isDev) {
  try {
    require('electron-reloader')(module);
  } catch (_) {}
}

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

  // Load the built Angular app directly from the file system
  const appPath = path.join(__dirname, 'dist/agentic-studio/browser/index.html');
  win.loadFile(appPath);

  // Open DevTools in development mode
  if (isDev) {
    win.webContents.openDevTools();
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
    return items
      .filter(item => !item.name.startsWith('.')) // Basic filter for hidden files
      .map(item => ({
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
        // Differentiate between binary media files and text files.
        // Read common image/video formats as base64, and everything else (including SVG) as utf-8.
        const mediaExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mov', '.mkv'];
        const extension = path.extname(filePath).toLowerCase();

        if (mediaExtensions.includes(extension)) {
            const data = await fs.readFile(filePath);
            return { content: data.toString('base64'), encoding: 'base64' };
        } else {
            const content = await fs.readFile(filePath, 'utf-8');
            return { content, encoding: 'utf-8' };
        }
    } catch (error) {
        console.error('Failed to read file:', error);
        return { error: error.message };
    }
});