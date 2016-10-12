const electron = require('electron');


// Module to control application life.
const app = electron.app
  // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  })

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  var port = 8086;
  var compressTiles = false;

  var WebSocketServer = require('tinywebsocketjs');
  var wsserver = new WebSocketServer({
    port: port
  });

  var zlib = require('zlib');

  var Screen = require('./screen.js');


  var WebSocket = require('ws');



  var compress = function(input, callback) {
    if (!compressTiles) {
      callback(input);
      return;
    }
    zlib.deflate(input, function(err, buffer) {
      callback(buffer);
    });
  };

  var BroadcastQueue = require('./broadcastQueue.js');
  var queue = new BroadcastQueue();

  setTimeout(function() {
    var screen = (new Screen({
      tileSize: 400
    })).on('resize', function(size) {

      //context.canvas.width = size.width;
      //context.canvas.height = size.height;

      queue.add('screen.resize', function() {

        wsserver.broadcast('screen.resize', JSON.stringify(size));

      });


    }).on('tile', function(data) {

      //context.putImageData(new ImageData(data.tile, data.width, data.height), data.x, data.y);

      var out = Buffer.from(data.tile); //'Hello World';

      compress(out, function(buffer) {
        queue.add('screen.tile' + data.x + '.' + data.y, function() {

          data.tile = buffer.toString('hex');
          wsserver.broadcast('screen.tile', JSON.stringify(data));

        });
      });

    })


    wsserver.addTask('screen_size', function(options, callback) {

      console.log('Request size: ');
      callback(screen.getSize());

    });

  }, 2000);



}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.