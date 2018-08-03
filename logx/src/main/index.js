import {
  app,
  BrowserWindow
} from 'electron'
const fs = require("fs");
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
  `http://localhost:9080` :
  `file://${__dirname}/index.html`


const {
  ipcMain
} = require('electron')


ipcMain.on('load-files', (event, arg) => {


  let logLines = [];
  let filesPaths = arg.files
  filesPaths = filesPaths.sort((a, b) => b.localeCompare(a));

  let stack = [];

  for (let i in filesPaths) {
    stack.push(i);
  }

  console.log("len: " + stack.length);

  let i = stack.pop();

  console.log("i: " + i)

  function done() {
    if (stack.length == 0) {
      console.log("replay" + i)
      event.sender.send('load-files-reply', logLines.join('\n'));
      console.log('end');
    } else {
      i = stack.pop();
      console.log("ii" + i)
      readLines(filesPaths[i], logLines, i, done)
    }
  }

  readLines(filesPaths[i], logLines, i, done)

});

function readLines(file, logLines, index, done) {
  var remaining = '';
  var input = fs.createReadStream(file);
  console.log("read file: " + file);
  input.on('data', function (data) {
    //console.log(data);
    remaining += data;
    var index = remaining.indexOf('\n');
    var last = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      line = line.replace(/[\n\r\t]/g, "");
      line = line.replace(/^\s+|\s+$/g, '');
      line = line.trim();
      last = index + 1;
      logLines.push(line);
      index = remaining.indexOf('\n', last);
    }
    remaining = remaining.substring(last);
  });

  input.on('end', function () {
    if (remaining.length > 0) {
      remaining = remaining.replace(/[\n\r\t]/g, "");
      remaining = remaining.replace(/^\s+|\s+$/g, '');
      remaining = remaining.trim();
      logLines.push(remaining);
    }
    done()
  });
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  require('./menu/mainmenu')
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})