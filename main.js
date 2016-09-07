import { electron, app, BrowserWindow, ipcMain, Menu, Tray } from 'electron';

import os from 'os';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let closeConfirmed = false;
// let launchedFromInstaller = false;
const platform = os.platform(); // 'darwin', 'linux', 'win32', 'android'
// let version = app.getVersion();
// let TrayMenu;


const handleStartupEvent = function () {
  if (process.platform !== 'win32') {
    return false;
  }

  const squirrelCommand = process.argv[1];

  function exeSquirrelCommand(args, cb) {
    const updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    const child = childProcess.spawn(updateDotExe, args, { detached: true });
    child.on('close', cb());
  }

  function install(cb) {
    const target = path.basename(process.execPath);
    exeSquirrelCommand(['--createShortcut', target], cb);
  }

  function uninstall(cb) {
    const target = path.basename(process.execPath);
    exeSquirrelCommand(['--removeShortcut', target], cb);
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
    default:
      break;
  }

  return true;
};

if (handleStartupEvent()) {
  console.log('OpenBazaar started on Windows...');
}

// Set daemon binary name
const daemon = (platform === 'darwin' || platform === 'linux') ? 'openbazaard' : 'openbazaard.exe';

const serverPath = `${__dirname}${path.sep}..${path.sep}openbazaar-go${path.sep}`;
let serverRunning = false;
let pendingKill;
// let startAfterClose;

const startLocalServer = function startLocalServer() {
  if (fs.existsSync(serverPath)) {
    if (pendingKill) {
      pendingKill.once('close', startLocalServer());
      return;
    }

    if (serverRunning) return;

    console.log('Starting OpenBazaar Server');

    // const random_port = Math.floor((Math.random() * 10000) + 30000);

    const sub = childProcess.spawn(serverPath + daemon, ['start'], {
      detach: false,
      cwd: `${__dirname}${path.sep}..${path.sep}openbazaar-go`,
    });

    serverRunning = true;

    let stdout = '';
    let stderr = '';
    let serverOut;

    const stdoutcallback = function (buf) {
      console.log('[STR] stdout "%s"', String(buf));
      stdout += buf;
      serverOut = `${serverOut}${buf}`;
    };
    sub.stdout.on('data', stdoutcallback);
    const stderrcallback = function stderrcallback(err) {
      if (err) {
        console.log(err);
        return err;
      }
      return false;
    };
    const stderrcb = function (buf) {
      console.log('[STR] stderr "%s"', String(buf));
      fs.appendFile(`${__dirname}${path.sep}error.log`, String(buf), stderrcallback);
      stderr += buf;
    };
    sub.stderr.on('data', stderrcb);
    const closecallback = function (code) {
      console.log(`exited with ${code}`);
      console.log('[END] stdout "%s"', stdout);
      console.log('[END] stderr "%s"', stderr);
      serverRunning = false;
    };
    sub.on('close', closecallback);
    sub.unref();
  } else {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript("console.log('Unable " +
      "to find openbazaard')");
    }
  }
};
startLocalServer();

// let killLocalServer = function () {
//   if (sub) {
//     if (pendingKill) {
//       startAfterClose && pendingKill.removeListener('close', startAfterClose);
//       return;
//     } else if (!serverRunning) {
//       return;
//     }
//     pendingKill = sub;
//     pendingKill.once('close', () => {
//       pendingKill = null;
//     });
//
//     console.log('Shutting down server daemon');
//
//     if (platform == "mac" || platform == "linux") {
//       subpy.kill('SIGINT');
//     } else {
//       require('childProcess').spawn("taskkill", ["/pid", sub.pid, '/f', '/t']);
//     }
//   } else {
//     mainWindow && mainWindow.webContents.executeJavaScript("console.log('Server
// is not running locally')");
//   }
// };

function createWindow() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo',
        },
        {
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          role: 'cut',
        },
        {
          role: 'copy',
        },
        {
          role: 'paste',
        },
        {
          role: 'pasteandmatchstyle',
        },
        {
          role: 'delete',
        },
        {
          role: 'selectall',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          },
        },
        {
          role: 'togglefullscreen',
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        {
          role: 'minimize',
        },
        {
          role: 'close',
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() { electron.shell.openExternal('https://openbazaar.org'); },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          role: 'about',
        },
        {
          type: 'separator',
        },
        {
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          role: 'hide',
        },
        {
          role: 'hideothers',
        },
        {
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          role: 'quit',
        },
      ],
    });
    // Edit menu.
    template[1].submenu.push(
      {
        type: 'separator',
      },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking',
          },
          {
            role: 'stopspeaking',
          },
        ],
      }
    );
    // Window menu.
    template[3].submenu = [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      {
        label: 'Zoom',
        role: 'zoom',
      },
      {
        type: 'separator',
      },
      {
        label: 'Bring All to Front',
        role: 'front',
      },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // put logic here to set tray icon based on OS
  const osTrayIcon = 'openbazaar-mac-system-tray.png';

  const trayMenu = new Tray(`${__dirname}/imgs/${osTrayIcon}`);
  const trayTemplate = [
    {
      label: 'Start Local Server',
      type: 'normal',
      click() { startLocalServer(); },
    },
    {
      label: 'Shutdown Local Server',
      type: 'normal',
      click() {
        if (fs.existsSync(serverPath)) {
          const workingDir = `${__dirname}${path.sep}..${path.sep}openbazaar-go`;
          childProcess.spawn(serverPath + daemon, ['stop'], {
            detach: false,
            cwd: workingDir,
          });
        } else {
          if (mainWindow) {
            mainWindow.webContents.executeJavaScript("console.log('Server is not " +
            "running locally')");
          }
        }
      },
    },
  ];

  trayTemplate.push(
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      type: 'normal',
      accelerator: 'Command+Q',
      click() {
        app.quit();
      },
    }
  );

  const contextMenu = Menu.buildFromTemplate(trayTemplate);

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

// const checkServerChange = function (event, server) {
//   // if (launchedFromInstaller) {
//   if (server.default) {
//     startLocalServer();
//   } else {
//     // killLocalServer();
//   }
//   // }
// };
// ipcMain.on('activeServerChange', checkServerChange());

ipcMain.on('close-confirmed', () => {
  closeConfirmed = true;

  if (mainWindow) mainWindow.close();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
