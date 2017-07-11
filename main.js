import {
  app, BrowserWindow, ipcMain,
  Menu, Tray, session, crashReporter,
  autoUpdater, shell,
} from 'electron';
import { argv } from 'yargs';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import urlparse from 'url-parse';
import _ from 'underscore';
import { guid } from './js/utils';
import LocalServer from './js/utils/localServer';
import { bindLocalServerEvent } from './js/utils/mainProcLocalServerEvents';

if (argv.userData) {
  try {
    app.setPath('userData', argv.userData);
  } catch (e) {
    throw new Error(`The passed in userData directory does not appear to be valid: ${e}`);
  }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let trayMenu;
let closeConfirmed = false;
const version = app.getVersion();
const feedURL = `https://updates2.openbazaar.org:5001/update/${process.platform}/${version}`;
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
const isBundledApp = _.once(() => fs.existsSync(serverPath + path.sep + serverFilename));
global.isBundledApp = isBundledApp;
let localServer;

if (isBundledApp()) {
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

crashReporter.start({
  productName: 'OpenBazaar 2',
  companyName: 'OpenBazaar',
  submitURL: 'http://104.131.17.128:1127/post',
  autoSubmit: true,
  extra: {
    bundled: isBundledApp(),
  },
});

/**
 * Handles valid OB2 protocol URLs in the webapp.
 *
 * @param  {Object} externalURL Contains a string url
 */
function handleDeepLinkEvent(externalURL) {
  if (!(typeof externalURL === 'string')) return;

  const theUrl = urlparse(externalURL);
  if (theUrl.protocol !== 'ob2:') {
    console.warn(`Unable to handle ${externalURL} because it's not the ob2: protocol.`);
    return;
  }

  const query = theUrl.query;
  const hash = theUrl.host;
  const pathname = theUrl.pathname;

  console.warn(`This is the hash to visit: ${hash}`);
  console.warn(`These are the query params: ${query}`);
  console.warn(`This is the path: ${pathname}`);

  // TODO: handle protocol links
}

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

    if (url.startsWith('ob2:')) {
      handleDeepLinkEvent(url);
    } else {
      console.info(`Preventing navigation to: ${url}`);
    }
  });
}

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
        // {
        //   label: 'Report Issue...',
        //   click() {
        //     // TODO: Open an issue tracking window
        //   },
        // },
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
          click() {
            shell.openExternal('https://docs.openbazaar.org');
          },
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
  const osTrayIcon = 'openbazaar-mac-system-tray.png';

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
          mainWindow.webContents.send('show-server-log', global.serverLog);
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
    icon: 'imgs/openbazaar-icon.png',
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

  // Set up protocol
  app.setAsDefaultProtocolClient('ob2');

  // Check for URL hijacking in the browser
  preventWindowNavigation(mainWindow);

  /**
   * For OS X users Squirrel manages the auto-updating code.
   * If there is an update available then we will send an IPC message to the
   * render process to notify the user. If the user wants to update
   * the software then they will send an IPC message back to the main process and we will
   * begin to download the file and update the software.
   */
  if (process.platform === 'darwin') {
    autoUpdater.on('error', (err, msg) => {
      console.log(msg);
    });

    autoUpdater.on('update-not-available', (msg) => {
      console.log(msg);
      mainWindow.send('updateNotAvailable');
    });

    autoUpdater.on('update-available', () => {
      mainWindow.send('updateAvailable');
    });

    autoUpdater.on('update-downloaded', (e, releaseNotes, releaseName,
      releaseDate, updateUrl, quitAndUpdate) => {
      // Old way of doing things
      // mainWindow.webContents.executeJavaScript('$(".js-softwareUpdate")
      // .removeClass("softwareUpdateHidden");');
      console.log(quitAndUpdate);
      mainWindow.send('updateReadyForInstall');
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

app.on('open-url', (e, url) => {
  e.preventDefault();
  handleDeepLinkEvent(url);
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
      details.requestHeaders.Cookie = `OpenBazaar_Auth_Cookie=${global.authCookie}silly`;
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
  global.serverLog += msg;

  if (mainWindow) {
    mainWindow.webContents.send('server-log', msg);
  }
};

if (localServer) bindLocalServerEvent('log', (localServ, msg) => log(msg));
ipcMain.on('server-connect-log', (e, msg) => log(msg));
