const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Global reference to prevent garbage collection
let mainWindow;
let pythonProcess;

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // --- DYNAMIC INITIAL SIZE ---
  // Open at 75% of the screen size (Logical starting size)
  const initialWidth = Math.round(screenWidth * 0.75);
  const initialHeight = Math.round(screenHeight * 0.75);

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,

    // --- STATIC MINIMUM SIZE ---
    // Fixed pixels. This allows the user to shrink the window significantly,
    // but stops before the UI layout breaks (adjust these numbers based on your React design).
    minWidth: 900,  
    minHeight: 600, 
    
    center: true, // Always open in center

    title: "CipherCert",
    icon: path.join(__dirname, 'public/logo.ico'), 
    
    // --- FORCE TITLE BAR COLOR ---
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0F172A',      
      symbolColor: '#FFFFFF', 
      height: 35             
    },

    webPreferences: {
      nodeIntegration: true,    
      contextIsolation: false,  
      webSecurity: false        
    },
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl).catch(e => {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// --- PYTHON BACKEND LAUNCHER ---
function startPythonBackend() {
  const backendDir = path.resolve(__dirname, '../backend');
  const scriptPath = path.join(backendDir, 'api.py');
  
  let pythonExecutable;
  if (process.platform === 'win32') {
    pythonExecutable = path.resolve(__dirname, '../venv/Scripts/python.exe');
  } else {
    pythonExecutable = path.resolve(__dirname, '../venv/bin/python');
  }

  console.log("--- DEBUG PATHS ---");
  console.log("Backend Dir:", backendDir);
  console.log("Python Script:", scriptPath);
  console.log("Python Exe:", pythonExecutable);

  if (!fs.existsSync(pythonExecutable)) {
    console.error("CRITICAL: Python executable not found at", pythonExecutable);
    return;
  }

  pythonProcess = spawn(pythonExecutable, ['-u', scriptPath], { 
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe'] 
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python API]: ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error]: ${data.toString()}`);
  });
  
  pythonProcess.on('error', (err) => {
    console.error('Failed to spawn Python process:', err);
  });
}

// --- THEME HANDLER ---
ipcMain.on('theme-changed', (event, mode) => {
  if (!mainWindow) return;

  if (mode === 'light') {
    mainWindow.setTitleBarOverlay({
      color: '#ffffff',
      symbolColor: '#000000'
    });
  } else {
    mainWindow.setTitleBarOverlay({
      color: '#0F172A',
      symbolColor: '#FFFFFF'
    });
  }
});

// --- APP LIFECYCLE ---
app.on('ready', () => {
  startPythonBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});