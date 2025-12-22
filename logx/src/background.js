/* eslint-disable no-console */
'use strict'

import { app, protocol, BrowserWindow, ipcMain, Menu } from 'electron'
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

// --- Log Stream Bridge (TCP -> WebSocket + IPC) ---
const TCP_PORT = 9020;
const WS_PORT = 9021;

let wss = null;
let tcpServer = null;
let tcpSockets = [];

function startLogBridge() {
  // Start WebSocket server for browser clients
  wss = new WebSocket.Server({ port: WS_PORT });
  console.log(`WebSocket server listening on port ${WS_PORT}`);

  wss.on('connection', ws => {
    console.log('WebSocket client connected');
    ws.on('close', () => console.log('WebSocket client disconnected'));
  });

  // Broadcast to all WebSocket clients and IPC to renderer
  function broadcastLog(data) {
    // Send to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
    // Send to Electron renderer via IPC
    if (win && win.webContents) {
      win.webContents.send('stream-data', data);
    }
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

  tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`TCP Bridge server listening on port ${TCP_PORT}`);
  });

  tcpServer.on('error', err => {
    console.error('TCP Server error:', err);
  });
}

// IPC handlers for manual control (optional, for UI toggle)
ipcMain.on('start-stream', () => {
  console.log('start-stream IPC received (bridge already running on app start)');
});

ipcMain.on('stop-stream', () => {
  console.log('stop-stream IPC received (bridge keeps running)');
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
