const { spawn } = require('child_process');
const path = require('path');

const electronBinary = require('electron');
const mainEntry = path.resolve(__dirname, '../../electron/main.js');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, [mainEntry], {
  stdio: 'inherit',
  env,
});

child.on('error', (error) => {
  console.error('Failed to launch Electron:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
