import {
  app, BrowserWindow, ipcMain,
  Menu, Tray, session, crashReporter,
  autoUpdater, shell, dialog,
} from 'electron';
import homedir from 'homedir';
import { argv } from 'yargs';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { guid } from './js/utils';
import LocalServer from './js/utils/localServer';
import { bindLocalServerEvent } from './js/utils/mainProcLocalServerEvents';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let trayMenu;
let closeConfirmed = false;
const version = app.getVersion();

function isOSWin64() {
  return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
}

const plat = process.platform === 'win32' ? `${isOSWin64() ? 'win64' : 'win32'}` : process.platform;

const feedURL = `https://hazel-server-imflzbzzpa.now.sh/update/${plat}/${version}`;

global.serverLog = '';

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
    exeSquirrelCommand(['--createShortcut', target, ' --shortcut-locations=Desktop,StartMenu'], cb);
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


const serverPath = `${__dirname}${path.sep}..${path.sep}openbazaar-go${path.sep}`;
const serverFilename = process.platform === 'darwin' || process.platform === 'linux' ?
  'openbazaard' : 'openbazaard.exe';
const isBundledApp = fs.existsSync(serverPath + serverFilename);
global.isBundledApp = isBundledApp;
let localServer;

if (isBundledApp) {
  global.localServer = localServer = new LocalServer({
    serverPath,
    serverFilename,
    errorLogPath: `${__dirname}${path.sep}..${path.sep}..${path.sep}error.log`,
    // IMPORTANT: From the main process, only bind events to the localServer instance
    // unsing the functions in the mainProcLocalServerEvents module. The reasons for that
    // will be explained in the module.
  });

  global.authCookie = guid();
}

const updatesSupported = process.platform === 'win32' || process.platform === 'darwin';
global.updatesSupported = updatesSupported;

// set the client data path
let defaultUserDataPath;

switch (process.platform) {
  case 'win32':
    defaultUserDataPath = `${homedir()}\\OpenBazaar2.0-ClientData`;
    break;
  case 'darwin':
    defaultUserDataPath = `${homedir()}/Library/Application Support/OpenBazaar2.0-ClientData`;
    break;
  default:
    defaultUserDataPath = `${homedir()}/.openbazaar2.0-clientData`;
}

const userDataPath = argv.userData || defaultUserDataPath;

// If you pass in a specific userData value as a command line option, we'll use that.
// Otherwise, if you're using the bundled app, we'll use a custom data dir (as defined
// in the switch above). Otherwise (running client from source), we won't update the data
// dir and the electron default will be used.
if (isBundledApp || argv.userData) {
  try {
    app.setPath('userData', userDataPath);
  } catch (e) {
    dialog.showErrorBox('Error setting the user data path',
      `There was an error setting the user data path to ${userDataPath}\n\n${e}`);
    app.exit();
  }
}

crashReporter.start({
  productName: 'OpenBazaar 2',
  companyName: 'OpenBazaar',
  submitURL: 'http://104.131.17.128:1127/post',
  autoSubmit: true,
  extra: {
    bundled: isBundledApp,
  },
});

/**
 * Prevent window navigation
 *
 * @param  {Object} win Contains a browserwindow object
 */
function preventWindowNavigation(win) {
  win.webContents.on('will-navigate', (e, url) => {
    // NB: Let page reloads through.
    if (url === win.webContents.getURL()) return;

    e.preventDefault();
  });
}

function createWindow() {
  // Check for updates an hour after the last check
  let checkForUpdatesInterval;

  const checkForUpdates = () => {
    clearInterval(checkForUpdatesInterval);
    autoUpdater.checkForUpdates();
    checkForUpdatesInterval = setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);
  };

  let helpSubmenu = [
    {
      label: 'Documentation',
      click() {
        shell.openExternal('https://docs.openbazaar.org');
      },
    },
  ];

  if (isBundledApp) {
    helpSubmenu = [
      {
        label: updatesSupported ? 'Check for Updates...' : 'Download Latest',
        click() {
          if (updatesSupported) {
            checkForUpdates();
          } else {
            shell.openExternal('https://github.com/phoreproject/openbazaar-desktop/releases');
          }
        },
      },
      {
        type: 'separator',
      },
      ...helpSubmenu,
    ];
  }

  const viewSubmenu = [
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
    {
      role: 'zoomin',
      accelerator: 'CommandOrControl+=',
    },
    {
      role: 'zoomout',
      accelerator: 'CommandOrControl+-',
    },
    {
      role: 'resetzoom',
    },
  ];

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
      submenu: viewSubmenu,
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
      submenu: helpSubmenu,
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
          accelerator: 'CmdOrCtrl+Q',
          click() {
            closeConfirmed = true;
            app.quit();
          },
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

  ipcMain.on('contextmenu-click', () => {
    menu.popup();
  });

  // put logic here to set tray icon based on OS
  let osTrayIcon = 'openbazaar-system-tray.png';
  if (process.platform === 'darwin') osTrayIcon = 'openbazaar-mac-system-tray.png';

  trayMenu = new Tray(`${__dirname}/imgs/${osTrayIcon}`);

  let trayTemplate = [];

  if (localServer) {
    trayTemplate = [
      {
        label: 'Start Local Server',
        type: 'normal',
        click() { localServer.start(); },
      },
      {
        label: 'Shutdown Local Server',
        type: 'normal',
        click() { localServer.stop(); },
      },
      {
        label: 'View Server Debug Log',
        type: 'normal',
        click() {
          mainWindow.focus();
          mainWindow.restore();
          mainWindow.webContents.send('show-server-log');
        },
      },
      {
        type: 'separator',
      },
    ];
  }

  trayTemplate.push({
    label: 'Quit',
    type: 'normal',
    accelerator: 'Command+Q',
    click() {
      app.quit();
    },
  });

  const contextMenu = Menu.buildFromTemplate(trayTemplate);

  trayMenu.setContextMenu(contextMenu);

  if (localServer) {
    if (localServer.isRunning) {
      contextMenu.items[0].enabled = false;
    } else {
      contextMenu.items[1].enabled = false;
    }

    bindLocalServerEvent('start', () => {
      contextMenu.items[0].enabled = false;
      contextMenu.items[1].enabled = true;
    });

    bindLocalServerEvent('exit', () => {
      contextMenu.items[0].enabled = true;
      contextMenu.items[1].enabled = false;
    });

    // we'll enable the debug log when our serverConnect module is ready
    contextMenu.items[2].enabled = false;
    ipcMain.on('server-connect-ready', () => (contextMenu.items[2].enabled = true));
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 1170,
    minHeight: 700,
    center: true,
    title: 'OpenBazaar',
    frame: false,
    icon: `${__dirname}/imgs/icon.png`,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/.tmp/index.html`);

  ipcMain.on('set-proxy', (e, id, socks5Setting = '') => {
    if (!id) {
      throw new Error('Please provide an id that will be passed back with the "proxy-set" ' +
        'event.');
    }

    mainWindow.webContents.session.setProxy({
      proxyRules: socks5Setting,
      proxyBypassRules: '<local>',
    }, () => mainWindow.webContents.send('proxy-set', id));
  });

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
    app.quit();
  });

  mainWindow.on('close', (e) => {
    mainWindow.send('close-attempt');

    if (mainWindow && !closeConfirmed) {
      e.preventDefault();
    }
  });

  /**
   * If there is an update available then we will send an IPC message to the
   * render process to notify the user. If the user wants to update
   * the software then they will send an IPC message back to the main process and we will
   * begin to download the file and update the software.
   */
  if (isBundledApp) {
    autoUpdater.on('checking-for-update', () => {
      mainWindow.send('updateChecking');
      mainWindow.send('consoleMsg', `Checking for update at ${autoUpdater.getFeedURL()}`);
    });

    autoUpdater.on('error', (err, msg) => {
      mainWindow.send('consoleMsg', msg);
      mainWindow.send('updateError', msg);
    });

    autoUpdater.on('update-not-available', () => {
      mainWindow.send('updateNotAvailable');
    });

    autoUpdater.on('update-available', () => {
      mainWindow.send('updateAvailable');
    });

    autoUpdater.on('update-downloaded', (e, releaseNotes, releaseName,
                                         releaseDate, updateUrl) => {
      const opts = {};
      opts.Name = releaseName;
      opts.URL = updateUrl;
      opts.Date = releaseDate;
      opts.Notes = releaseNotes;
      mainWindow.send('updateReadyForInstall', opts);
    });

    // Listen for installUpdate command to install the update
    ipcMain.on('installUpdate', () => {
      autoUpdater.quitAndInstall();
    });

    // Listen for checkForUpdate command to manually check for new versions
    ipcMain.on('checkForUpdate', () => {
      checkForUpdates();
    });

    autoUpdater.setFeedURL(feedURL);
  }

  mainWindow.webContents.on('dom-ready', () => {
    // Check for an update once the DOM is ready so the update dialog box can be shown
    if (isBundledApp) checkForUpdates();
  });

  // Set up protocol
  app.setAsDefaultProtocolClient('ob');

  // Check for URL hijacking in the browser
  preventWindowNavigation(mainWindow);
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

const handleObLink = (route) => {
  if (!route || typeof route !== 'string') {
    throw new Error('Please provide a route as a string.');
  }

  global.externalRoute = route;

  if (mainWindow) {
    // if our app router is fully loaded it will process the event sent below, otherwise
    // the global.externalRoute will be used
    mainWindow.webContents.send('external-route', route);
  }
};

app.on('open-url', (e, uri) => {
  e.preventDefault();
  const url = uri.split('://')[1];

  if (url) {
    handleObLink(url);
  }
});

ipcMain.on('close-confirmed', () => {
  closeConfirmed = true;

  if (mainWindow) mainWindow.close();
});

// If appropriate, add in Basic Auth headers to each request. If connecting to
// the built-in server, we'll add in the auth token.
ipcMain.on('active-server-set', (e, server) => {
  const filter = {
    urls: [`${server.httpUrl}*`, `${server.socketUrl}*`],
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if (server.authenticate) {
      const un = server.username;
      const pw = server.password;

      details.requestHeaders.Authorization =
        `Basic ${new Buffer(`${un}:${pw}`).toString('base64')}`;
    }

    if (global.authCookie && server.default) {
      details.requestHeaders.Cookie = `OpenBazaar_Auth_Cookie=${global.authCookie}`;
    }

    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
});

// some cleanup when our app is exiting
process.on('exit', () => {
  closeConfirmed = true;
  app.quit();
  if (localServer) localServer.stop();
});

// Aggreate and make available the localServer and serverConnect
// module logs into one cohesive server log.
const log = msg => {
  if (typeof msg !== 'string') {
    throw new Error('Please provide a message as a string.');
  }

  if (!msg) return;

  // Prevent the logs / msg from getting so large it eats up all the ram
  // and crashes the client.
  const message = msg.slice(msg.length - 500000);
  global.serverLog += message;
  global.serverLog = global.serverLog.slice(global.serverLog.length - 2000000);

  if (mainWindow) {
    mainWindow.webContents.send('server-log', message);
  }
};

if (localServer) bindLocalServerEvent('log', (localServ, msg) => log(msg));
ipcMain.on('server-connect-log', (e, msg) => log(msg));

ipcMain.on('set-badge-count', (event, count) => {
  // setBadgeCount is only available on certain environements:
  // https://github.com/electron/electron/blob/master/docs/api/app.md#appsetbadgecountcount-linux-macos
  try {
    app.setBadgeCount(count);
  } catch (err) {
    // pass
    console.log(err);
  }
});
