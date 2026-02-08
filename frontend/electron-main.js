// frontend/electron-main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// در حالت CommonJS نیازی به fileURLToPath نیست
// __dirname به صورت خودکار وجود دارد

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // استفاده از 127.0.0.1 برای اطمینان
  const startUrl = process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startPythonBackend() {
  const scriptPath = path.join(__dirname, '../backend/api.py');
  
  // تشخیص سیستم عامل
  let pythonExecutable = 'python';
  if (process.platform === 'win32') {
      pythonExecutable = '../venv/Scripts/python.exe';
  } else {
      pythonExecutable = '../venv/bin/python';
  }
  
  const pythonPath = path.join(__dirname, pythonExecutable);

  console.log("---------------- STARTUP CHECK ----------------");
  console.log("OS Platform:", process.platform);
  console.log("Looking for Python at:", pythonPath);

  if (!fs.existsSync(pythonPath)) {
      console.error("❌ CRITICAL ERROR: Python not found at:", pythonPath);
      return;
  }

  // اجرای پایتون
  pythonProcess = spawn(pythonPath, ['-u', scriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python]: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Err]: ${data}`);
  });
}

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