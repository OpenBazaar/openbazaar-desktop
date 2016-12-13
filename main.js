import {
  electron, app, BrowserWindow, ipcMain,
  Menu, Tray, session,
} from 'electron';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import _ from 'underscore';
import LocalServer from './js/utils/localServer';
import { bindLocalServerEvent } from './js/utils/mainProcLocalServerEvents';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let trayMenu;
let closeConfirmed = false;
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

// const serverPath = `${__dirname}${path.sep}..${path.sep}OpenBazaar-Server${path.sep}`;
const serverPath = `${__dirname}${path.sep}..${path.sep}` +
  `test-server${path.sep}`;
const isBundledApp = _.once(() => fs.existsSync(serverPath));
global.isBundledApp = isBundledApp;
let localServer;

if (isBundledApp) {
  global.localServer = localServer = new LocalServer({
    serverPath,
    serverFilename: process.platform === 'darwin' || process.platform === 'linux' ?
      'openbazaard' : 'openbazaard.exe',
    errorLogPath: `${__dirname}${path.sep}..${path.sep}..${path.sep}error.log`,
    // IMPORTANT: From the main process, only bind events to the localServer instance
    // unsing the functions in the mainProcLocalServerEvents module. The reasons for that
    // will be exaplained in the module.
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

  trayMenu = new Tray(`${__dirname}/imgs/${osTrayIcon}`);

  let trayTemplate;

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

    bindLocalServerEvent('close', () => {
      contextMenu.items[0].enabled = true;
      contextMenu.items[1].enabled = false;
    });
  }

  // we'll enable the debug log when our serverConnect module is ready
  contextMenu.items[2].enabled = false;
  ipcMain.on('server-connect-ready', () => (contextMenu.items[2].enabled = true));

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

    if (mainWindow && !closeConfirmed) {
      e.preventDefault();
    }
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

ipcMain.on('close-confirmed', () => {
  closeConfirmed = true;

  if (mainWindow) mainWindow.close();
});

// If appropriate, add in Basic Auth headers to each request.
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

bindLocalServerEvent('log', (localServ, msg) => log(msg));
ipcMain.on('server-connect-log', (e, msg) => log(msg));

