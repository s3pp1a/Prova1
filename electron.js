const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'dist', 'favicon.ico')
  });

  // Carica l'app da dist
  // In produzione (app impacchettata), i file sono nella root
  // In sviluppo, sono in dist/
    // Carica l'app
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath);
  
  // Log per debugging
  console.log('Caricamento da:', indexPath);
  
  // Gestione errori di caricamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Errore di caricamento:', errorCode, errorDescription);
  });
  // Apri DevTools in sviluppo (commentare in produzione)
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
