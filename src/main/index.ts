import 'dotenv/config';
import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { logger } from '../core/utils/logger';

protocol.registerSchemesAsPrivileged([
  { scheme: 'launcher-file', privileges: { bypassCSP: true, stream: true } },
]);

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Needed for preload script file access
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (isDev || process.env.OPEN_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Main window created');
}

// ── App Lifecycle ──────────────────────────────────────────────
app.whenReady().then(() => {
  registerIpcHandlers(ipcMain);
  createWindow();

  protocol.handle('launcher-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('launcher-file://', ''));
    return net.fetch('file://' + filePath);
  });

  app.on('activate', () => {
    // macOS: re-create window when dock icon clicked
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
