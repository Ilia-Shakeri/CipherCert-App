const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Global reference to keep the window and python process alive
let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "CipherCert",
    icon: path.join(__dirname, '../frontend/public/logo.ico'),
    
    // --- FORCE TITLE BAR COLOR ---
    // 'hidden' removes the native Windows frame so we can color it
    titleBarStyle: 'hidden',
    // Default to Dark Mode colors on startup
    titleBarOverlay: {
      color: '#0F172A',      // Dark background
      symbolColor: '#FFFFFF', // White icons
      height: 35             // Height of the top bar
    },

    webPreferences: {
      nodeIntegration: true,    // Allows using Node.js in React
      contextIsolation: false,  // Required for window.require to work easily
      webSecurity: false        
    },
    
    autoHideMenuBar: true, 
    backgroundColor: '#0F172A',
  });

  const isDev = !app.isPackaged;
  const startUrl = process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173';

  if (isDev) {
      mainWindow.loadURL(startUrl);
  } else {
      mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- PYTHON BACKEND LAUNCHER ---
function startPythonBackend() {
  // 1. Define paths relative to this file (electron/main.js)
  // We go up one level (..) to get to the project root
  const backendDir = path.join(__dirname, '../backend');
  const scriptPath = path.join(backendDir, 'api.py');
  
  // 2. Find Python Executable
  let pythonExecutable;
  if (process.platform === 'win32') {
    // Look for local venv first
    const venvPython = path.join(__dirname, '../venv/Scripts/python.exe');
    if (fs.existsSync(venvPython)) {
        pythonExecutable = venvPython;
    } else {
        // Fallback to global python if venv is missing
        pythonExecutable = 'python'; 
    }
  } else {
    // Linux/Mac
    const venvPython = path.join(__dirname, '../venv/bin/python');
    if (fs.existsSync(venvPython)) {
        pythonExecutable = venvPython;
    } else {
        pythonExecutable = 'python3';
    }
  }

  console.log("--- STARTING BACKEND ---");
  console.log("Python Path:", pythonExecutable);
  console.log("Script Path:", scriptPath);

  // 3. Spawn the Python Process
  // 'cwd' is crucial so Python finds engine.py and models.py
  pythonProcess = spawn(pythonExecutable, ['-u', scriptPath], { 
    cwd: backendDir 
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python API]: ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error]: ${data.toString()}`);
  });
  
  pythonProcess.on('error', (err) => {
    console.error('Failed to spawn Python process. Is Python installed?', err);
  });
}

// --- THEME HANDLER (The Fix for Black Bar) ---
ipcMain.on('theme-changed', (event, mode) => {
  if (!mainWindow) return;

  if (mode === 'light') {
    // Light Mode: White Background, Black Icons
    mainWindow.setTitleBarOverlay({
      color: '#ffffff',
      symbolColor: '#000000'
    });
  } else {
    // Dark Mode: Dark Background, White Icons
    mainWindow.setTitleBarOverlay({
      color: '#0F172A',
      symbolColor: '#FFFFFF'
    });
  }
});

// --- APP LIFECYCLE ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    startPythonBackend(); // Start Python
    createWindow();       // Start UI

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    // Kill Python process when App quits to prevent zombie processes
    if (pythonProcess) {
      pythonProcess.kill();
    }
  });
}