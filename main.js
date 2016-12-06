import { electron, app, BrowserWindow, ipcMain, Menu, Tray, autoUpdater,
  ipcRenderer, shell } from 'electron';

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
const version = app.getVersion();
const feedURL = 'https://updates2.openbazaar.org:5001/update/' + platform + '/' + version; // eslint-disable-line
// let TrayMenu;


const handleStartupEvent = function () {
  // noinspection ES6ModulesDependencies
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

    const stdoutcallback = (buf) => {
      console.log('[STR] stdout "%s"', String(buf));
      stdout += buf;
      serverOut = `${serverOut}${buf}`;
    };
    sub.stdout.on('data', stdoutcallback);
    const stderrcallback = (err) => {
      if (err) {
        console.log(err);
        return err;
      }
      return false;
    };
    const stderrcb = (buf) => {
      console.log('[STR] stderr "%s"', String(buf));
      fs.appendFile(`${__dirname}${path.sep}error.log`, String(buf), stderrcallback);
      stderr += buf;
    };
    sub.stderr.on('data', stderrcb);
    const closecallback = (code) => {
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
          label: 'Report Issue...',
          click() {
            // TODO: Open an issue tracking window
          },
        },
        {
          label: 'Check for Updates...',
          click() {
            autoUpdater.checkForUpdates();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Documentation',
          click() { electron.shell.openExternal('https://docs.openbazaar.org'); },
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
    mainWindow.webContents.openDevTools({
      detach: true,
    });
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

  /**
   * For OS X users Squirrel manages the auto-updating code.
   * If there is an update available then we will send an IPC message to the
   * render process to notify the user. If the user wants to update
   * the software then they will send an IPC message back to the main process and we will
   * begin to download the file and update the software.
   */
  if (platform === 'darwin') {
    autoUpdater.on('error', (err, msg) => {
      console.log(msg);
    });

    autoUpdater.on('update-not-available', (msg) => {
      console.log(msg);
      ipcRenderer.send('updateNotAvailable');
    });

    autoUpdater.on('update-available', () => {
      ipcRenderer.send('updateAvailable');
    });

    autoUpdater.on('update-downloaded', (e, releaseNotes, releaseName,
      releaseDate, updateUrl, quitAndUpdate) => {
      // Old way of doing things
      // mainWindow.webContents.executeJavaScript('$(".js-softwareUpdate")
      // .removeClass("softwareUpdateHidden");');
      console.log(quitAndUpdate);
      ipcRenderer.send('updateReadyForInstall');
    });

    // Listen for installUpdate command to install the update
    ipcMain.on('installUpdate', () => {
      autoUpdater.quitAndInstall();
    });

    // Listen for checkForUpdate command to manually check for new versions
    ipcMain.on('checkForUpdate', () => {
      autoUpdater.checkForUpdates();
    });

    autoUpdater.setFeedURL(feedURL);

    // Check for updates every hour
    autoUpdater.checkForUpdates();
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);
  }
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
