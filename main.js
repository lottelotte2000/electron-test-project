// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// --- Configure auto-updater ---
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Optional: Disable auto download, ask user first
// autoUpdater.autoDownload = false;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Use a preload script
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools(); // Open DevTools for debugging
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  log.info(`App version: ${app.getVersion()}`);
  mainWindow.webContents.send('app-version', app.getVersion());

  if (app.isPackaged) {
    log.info('Checking for updates (app is packaged).');
    // Check for updates 5 seconds after app starts
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC for manual update check ---
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.on('check-for-update', () => {
  log.info('Manual update check requested by renderer.');
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    dialog.showMessageBox({
      type: 'info',
      title: 'Development Mode',
      message: 'Auto-update feature is disabled in development mode.',
      buttons: ['OK']
    });
    mainWindow.webContents.send('update-message', 'Auto-update is disabled in development mode.');
  }
});

// --- AutoUpdater Event Handlers ---
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
  mainWindow.webContents.send('update-message', 'Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.', info);
  mainWindow.webContents.send('update-message', `Update available: ${info.version}. Downloading...`);
  // If autoDownload is false, you'd prompt the user here before calling autoUpdater.downloadUpdate()
  // For this example, autoDownload is implicitly true (default) or you can explicitly call downloadUpdate()
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.', info);
  mainWindow.webContents.send('update-message', 'You are on the latest version.');
  dialog.showMessageBox({
    type: 'info',
    title: 'No Updates',
    message: 'You are currently on the latest version.',
    buttons: ['OK']
  });
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
  mainWindow.webContents.send('update-message', `Error in auto-updater: ${err.message}`);
  dialog.showErrorBox('Update Error', `Failed to update: ${err.message || err}`);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded <span class="math-inline">\{progressObj\.percent\.toFixed\(2\)\}% \(</span>{progressObj.transferred}/${progressObj.total})`;
  log.info(log_message);
  mainWindow.webContents.send('update-message', `Downloading: ${progressObj.percent.toFixed(2)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded.', info);
  mainWindow.webContents.send('update-message', `Update downloaded (${info.version}). Restart to install.`);
  dialog.showMessageBox({
    title: 'Install Updates',
    message: `Updates for version ${info.version} have been downloaded. Restart the application to apply the updates.`,
    buttons: ['Restart Now', 'Later']
  }).then((buttonResult) => {
    if (buttonResult.response === 0) { // Restart Now
      autoUpdater.quitAndInstall();
    }
  });
});