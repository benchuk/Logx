/* eslint-disable no-console */
//'use strict'

import { app, ipcMain, clipboard, Menu } from 'electron'

console.log('Loading Menu...', process.platform)
function init(win) {
  let isMac = process.platform === 'darwin'
  const template = [
    // { role: 'appMenu' }

    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
    },
    //{ role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        //   { role: 'undo' },
        //   { role: 'redo' },
        //   { type: 'separator' },
        //   { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'From Clipboard',
          click() {
            let txt = clipboard.readText()
            //console.log('paste: ', txt)
            var logLines = []
            var remaining = txt
            var index = remaining.indexOf('\n')
            var last = 0
            while (index > -1) {
              var line = remaining.substring(last, index)
              // line = line.replace(/[\n\r\t]/g, '')
              // line = line.replace(/^\s+|\s+$/g, '')
              // line = line.trim()
              last = index + 1
              logLines.push(line)
              index = remaining.indexOf('\n', last)
            }
            remaining = remaining.substring(last)
            if (remaining.length > 0) {
              // remaining = remaining.replace(/[\n\r\t]/g, '')
              // remaining = remaining.replace(/^\s+|\s+$/g, '')
              // remaining = remaining.trim()
              logLines.push(remaining)
            }
            //console.log('paste:: ', logLines)
            if (logLines.length > 0) {
              win.webContents.send('paste-data-reply', logLines.join('\n'))
              //ipcMain.emit('load-files-reply', )
            }
          },
          accelerator: 'CmdOrCtrl+m'
        }
        //   ...(isMac ? [
        //     { role: 'pasteAndMatchStyle' },
        //     { role: 'delete' },
        //     { role: 'selectAll' },
        //     { type: 'separator' },
        //     {
        //       label: 'Speech',
        //       submenu: [
        //         { role: 'startspeaking' },
        //         { role: 'stopspeaking' }
        //       ]
        //     }
        //   ] : [
        //     { role: 'delete' },
        //     { type: 'separator' },
        //     { role: 'selectAll' }
        //   ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [{ role: 'close' }])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
export default init
