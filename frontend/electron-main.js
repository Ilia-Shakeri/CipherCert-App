const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Global reference to prevent garbage collection
let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "CipherCert",
    icon: path.join(__dirname, 'public/logo.ico'), // Adjusted path for typical structure
    
    // --- FORCE TITLE BAR COLOR ---
    // 'hidden' removes the native Windows frame but keeps the traffic light buttons
    titleBarStyle: 'hidden',
    // We set the overlay controls to match the initial Dark Mode
    titleBarOverlay: {
      color: '#0F172A',      // Dark background
      symbolColor: '#FFFFFF', // White icons
      height: 35             // Height of the top bar
    },

    webPreferences: {
      nodeIntegration: true,    // Allows using Node.js in React
      contextIsolation: false,  // Required for window.require to work easily
      webSecurity: false        // (Optional) Helps with local dev CORS sometimes
    },
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl).catch(e => {
    // If dev server isn't running, fall back to build file
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// --- PYTHON BACKEND LAUNCHER ---
function startPythonBackend() {
  // 1. Resolve absolute paths to avoid "file not found" errors
  // Assuming structure: root/frontend/electron-main.js -> root/backend
  const backendDir = path.resolve(__dirname, '../backend');
  const scriptPath = path.join(backendDir, 'api.py');
  
  // 2. Determine Python Executable Path
  let pythonExecutable;
  if (process.platform === 'win32') {
    // Windows: root/venv/Scripts/python.exe
    pythonExecutable = path.resolve(__dirname, '../venv/Scripts/python.exe');
  } else {
    // Linux/Mac: root/venv/bin/python
    pythonExecutable = path.resolve(__dirname, '../venv/bin/python');
  }

  console.log("--- DEBUG PATHS ---");
  console.log("Backend Dir:", backendDir);
  console.log("Python Script:", scriptPath);
  console.log("Python Exe:", pythonExecutable);

  // 3. Check if files exist before spawning
  if (!fs.existsSync(pythonExecutable)) {
    console.error("CRITICAL: Python executable not found at", pythonExecutable);
    console.error("Please check if 'venv' exists in the project root.");
    return;
  }

  // 4. Spawn the process
  // cwd: backendDir is CRITICAL so python can find 'engine.py'
  pythonProcess = spawn(pythonExecutable, ['-u', scriptPath], { 
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe'] // Capture output
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

// --- THEME HANDLER (The Fix for Black Bar) ---
ipcMain.on('theme-changed', (event, mode) => {
  if (!mainWindow) return;

  if (mode === 'light') {
    // Force White Background, Black Icons
    mainWindow.setTitleBarOverlay({
      color: '#ffffff',
      symbolColor: '#000000'
    });
  } else {
    // Force Dark Background, White Icons
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
  // Kill Python process when Electron quits
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});