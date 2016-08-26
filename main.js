import { app, BrowserWindow, ipcMain, Menu, Tray, remote, ps } from 'electron';
let os = require('os');
let path = require('path');
let fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let closeConfirmed = false;
let launched_from_installer = false;
let platform = os.platform(); // 'darwin', 'linux', 'win32', 'android'
let version = app.getVersion();
let TrayMenu;



var handleStartupEvent = function() {
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];

  function exeSquirrelCommand(args, cb) {
    var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    var child = require('child_process').spawn(updateDotExe, args, { detached: true });
    child.on('close', function() {
      cb();
    });
  }

  function install(cb) {
    var target = path.basename(process.execPath);
    exeSquirrelCommand(["--createShortcut", target], cb);
  }

  function uninstall(cb) {
    var target = path.basename(process.execPath);
    exeSquirrelCommand(["--removeShortcut", target], cb);
  }

  switch (squirrelCommand) {
  case '--squirrel-install':
    install(app.quit);
    break;

  case '--squirrel-updated':
    // Always quit when done
    app.quit();
    return true;

  case '--squirrel-uninstall':
    // Always quit when done
    uninstall(app.quit);
    return true;

  case '--squirrel-obsolete':
    // This is called on the outgoing version of your app before
    // we update to the new version - it's the opposite of
    // --squirrel-updated
    app.quit();
    return true;
  }
};

if (handleStartupEvent()) {
  console.log('OpenBazaar started on Windows...');
}

// Set daemon binary name
let daemon = (platform == "darwin" || platform == "linux") ? "openbazaard" : "openbazaard.exe";

let serverPath = __dirname + path.sep + '..' + path.sep + 'openbazaar-go' + path.sep,
    serverOut = '',
    serverRunning = false,
    pendingKill,
    startAfterClose;

let start_local_server = function() {
  if(fs.existsSync(serverPath)) {

    if (pendingKill) {
      pendingKill.once('close', startAfterClose = () => {
        start_local_server();
      });

      return;
    }

    if (serverRunning) return;

    console.log('Starting OpenBazaar Server');

    var random_port = Math.floor((Math.random() * 10000) + 30000);

    let sub = require('child_process').spawn(serverPath + daemon, ['start'], {
      detach: false,
      cwd: __dirname + path.sep + '..' + path.sep + 'openbazaar-go'
    });

    serverRunning = true;

    var stdout = '';
    var stderr = '';

    sub.stdout.on('data', function (buf) {
      console.log('[STR] stdout "%s"', String(buf));
      stdout += buf;
      serverOut += buf;
    });
    sub.stderr.on('data', function (buf) {
      console.log('[STR] stderr "%s"', String(buf));
      fs.appendFile(__dirname + path.sep + "error.log", String(buf), function(err) {
          if(err) {
              return console.log(err);
          }
      });
      stderr += buf;
    });
    sub.on('close', function (code) {
      console.log('exited with ' + code);
      console.log('[END] stdout "%s"', stdout);
      console.log('[END] stderr "%s"', stderr);
      serverRunning = false;
    });
    sub.unref();
  } else {
    mainWindow && mainWindow.webContents.executeJavaScript("console.log('Unable to find openbazaard')");
  }
};
start_local_server();

let kill_local_server = function() {
  if (sub) {
    if (pendingKill) {
      startAfterClose && pendingKill.removeListener('close', startAfterClose);
      return;
    } else if (!serverRunning) {
      return;
    }
    pendingKill = sub;
    pendingKill.once('close', () => {
      pendingKill = null;
    });

    console.log('Shutting down server daemon');

    if (platform == "mac" || platform == "linux") {
      subpy.kill('SIGINT');
    } else {
      require('child_process').spawn("taskkill", ["/pid", sub.pid, '/f', '/t']);
    }
  } else {
    mainWindow && mainWindow.webContents.executeJavaScript("console.log('Server is not running locally')");
  }
};

function createWindow() {

  const template = [
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload()
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        }
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://openbazaar.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // Edit menu.
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    }
  )
  // Window menu.
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// put logic here to set tray icon based on OS
var osTrayIcon = 'openbazaar-mac-system-tray.png';

let trayMenu = new Tray(__dirname + '/imgs/' + osTrayIcon);
var tray_template = [
  {
    label: 'Start Local Server', type: 'normal', click: function () {
    start_local_server();
  }
  },
  {
    label: 'Shutdown Local Server', type: 'normal', click: function () {
      if(fs.existsSync(serverPath)) {
        let subkill = require('child_process').spawn(serverPath + daemon, ['stop'], {
          detach: false,
          cwd: __dirname + path.sep + '..' + path.sep + 'openbazaar-go'
        });
      } else {
        mainWindow && mainWindow.webContents.executeJavaScript("console.log('Server is not running locally')");
      }
    }
  }
];

tray_template.push(
  {
    type: 'separator'
  },
  {
    label: 'Quit', type: 'normal', accelerator: 'Command+Q', click: function () {
      app.quit();
    }
  }
);

var contextMenu = Menu.buildFromTemplate(tray_template);

trayMenu.setContextMenu(contextMenu);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 1170,
    minHeight: 700,
    center: true,
    title: 'OpenBazaar',
    frame: false,
    icon: 'imgs/openbazaar-icon.png',
    //titleBarStyle: 'hidden',
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/.tmp/index.html`);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }



  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.on('close', (e) => {
    mainWindow.send('close-attempt');
    if (!closeConfirmed) e.preventDefault();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their Menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});

ipcMain.on('activeServerChange', function(event, server) {
  if (launched_from_installer) {
    if (server.default) {
      start_local_server();
    } else {
      kill_local_server();
    }
  }
});

ipcMain.on('close-confirmed', () => {
  closeConfirmed = true;

  if (mainWindow) mainWindow.close();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
