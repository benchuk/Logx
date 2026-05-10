/* eslint-disable no-console */
'use strict'

import { app, protocol, BrowserWindow, ipcMain, Menu } from 'electron'
import { spawn, execSync } from 'child_process'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

// eslint-disable-next-line no-unused-vars
import file_handler from './loggi_files_handler'
import app_menu from './components/appMenu'
import net from 'net'
import WebSocket from 'ws'
file_handler(ipcMain)

// Fix PATH to inherit from user's shell (macOS/Linux)
function fixPath() {
  if (process.platform === 'win32') return;
  try {
    const shell = process.env.SHELL || '/bin/zsh';
    // Run shell as login shell to get full PATH including .zshrc/.bash_profile
    const shellPath = execSync(`${shell} -ilc "echo $PATH"`, { 
      encoding: 'utf8',
      timeout: 3000 // 3s timeout to prevent hang
    }).trim();
    
    if (shellPath && shellPath.includes('/')) {
      process.env.PATH = shellPath;
      console.log('Inherited PATH from shell:', shellPath);
    }
  } catch (err) {
    console.error('Failed to inherit PATH from shell:', err.message);
  }
}
fixPath();


// --- Log Stream Bridge (TCP -> WebSocket + IPC) ---
const TCP_PORT = 9020;
const WS_PORT = 9021;

let wss = null;
let tcpServer = null;
let tcpSockets = [];

function startLogBridge() {
  try {
    // Start WebSocket server for browser clients
    wss = new WebSocket.Server({ port: WS_PORT });
    console.log(`WebSocket server listening on port ${WS_PORT}`);

    wss.on('connection', ws => {
      console.log('WebSocket client connected');
      ws.on('close', () => console.log('WebSocket client disconnected'));
    });

    wss.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`WebSocket Port ${WS_PORT} is in use. Bridge likely already running.`);
      } else {
        console.error('WebSocket Server error:', err);
      }
    });

    // Broadcast to all WebSocket clients and IPC to renderer
    function broadcastLog(data) {
      if (!wss) return;
      // Send to WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
      // Send to Electron renderer via IPC - REMOVED to prevent duplication/leaks. 
      // Frontend uses WebSocket.
      /*
      if (win && win.webContents) {
        win.webContents.send('stream-data', data);
      }
      */
    }

    // Start TCP server to receive logs from run_server.sh
    tcpServer = net.createServer(socket => {
      console.log('Log source connected via TCP');
      tcpSockets.push(socket);

      socket.on('data', data => {
        broadcastLog(data.toString());
      });

      socket.on('end', () => {
        console.log('Log source disconnected');
        tcpSockets = tcpSockets.filter(s => s !== socket);
      });

      socket.on('error', err => {
        console.log('TCP Socket error:', err.message);
        tcpSockets = tcpSockets.filter(s => s !== socket);
      });
    });

    tcpServer.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`TCP Port ${TCP_PORT} is already in use. Bridge likely already running.`);
      } else {
        console.error('TCP Server error:', err);
      }
    });

    tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
      console.log(`TCP Bridge server listening on port ${TCP_PORT}`);
    });

  } catch (e) {
    console.error('Failed to start log bridge:', e);
  }
}

// IPC handlers for manual control (optional, for UI toggle)
ipcMain.on('start-stream', () => {
  console.log('start-stream IPC received (bridge already running on app start)');
});

ipcMain.on('stop-stream', () => {
  console.log('stop-stream IPC received (bridge keeps running)');
});

// --- Terminal Command Execution ---
let commandProcess = null;

ipcMain.on('execute-command', (event, command) => {
  if (commandProcess) {
    try {
      process.kill(-commandProcess.pid); // Kill process group
    } catch (e) {
      try {
        commandProcess.kill();
      } catch (e2) {
        console.error('Failed to kill existing process', e2);
      }
    }
    commandProcess = null;
  }

  console.log(`Executing command: ${command}`);
  if (!win || !win.webContents) return;

  win.webContents.send('command-output', `\n--- STARTING COMMAND: ${command} ---\n`);

  try {
    // shell: true allows simplified command strings like "ping google.com | grep time"
    // detach: true allows killing the process group later
    commandProcess = spawn(command, {
      shell: true,
      detached: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    commandProcess.stdout.on('data', (data) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('command-output', data.toString());
      }
    });

    commandProcess.stderr.on('data', (data) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('command-output', data.toString());
      }
    });

    commandProcess.on('close', (code) => {
      console.log(`Command processed exited with code ${code}`);
      if (win && !win.isDestroyed()) {
        win.webContents.send('command-output', `\n--- COMMAND EXITED WITH CODE ${code} ---\n`);
        win.webContents.send('command-stopped', code); // Notify UI
      }
      commandProcess = null;
    });

    commandProcess.on('error', (err) => {
      console.error('Command spawn error:', err);
      if (win && !win.isDestroyed()) {
        win.webContents.send('command-output', `\n! ERROR STARTING COMMAND: ${err.message}\n`);
        win.webContents.send('command-stopped', -1);
      }
      commandProcess = null;
    });

  } catch (e) {
    console.error('Exception executing command:', e);
    win.webContents.send('command-output', `\n! EXCEPTION: ${e.message}\n`);
    win.webContents.send('command-stopped', -1);
  }
});

ipcMain.on('stop-command', () => {
  if (commandProcess) {
    console.log('Stopping command process...');
    try {
      // Negative PID kills the process group (requires detached: true)
      process.kill(-commandProcess.pid);
    } catch (e) {
      console.error('Failed to kill process group, trying simple kill', e);
      try {
        commandProcess.kill();
      } catch (e2) {
        console.error('Failed to simple kill', e2);
      }
    }
    commandProcess = null;
  }
});

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow() {
  console.log('--- DEBUG: createWindow START ---');
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      plugins: true
    },
    show: true // Don't show until ready
  })
  console.log('--- DEBUG: BrowserWindow INSTANCE CREATED ---');
  app_menu(win);

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    console.log('--- DEBUG: ready-to-show EVENT FIRED ---');
    win.show()
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })

  // Log any navigation errors
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('Paste', (a) => {
  console.log('sdsdssds', a);
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  console.log('--- DEBUG: APP READY EVENT FIRED ---');
  // Note: installVueDevtools() removed - deprecated and broken in Electron v28+
  // Use Vue DevTools browser extension instead if needed
  createWindow()
  startLogBridge() // Auto-start the log bridge
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
