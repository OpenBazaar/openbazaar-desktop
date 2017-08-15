import { ipcMain, ipcRenderer, autoUpdater } from 'electron';
import app from '../app';
import Dialog from '../views/modals/Dialog';

/**
 * If there is an update available then we will send an IPC message to the
 * render process to notify the user. If the user wants to update
 * the software then they will send an IPC message back to the main process and we will
 * begin to download the file and update the software.
 */

export function addAutoUpdate(mainWindow, feedURL) {
  if (!mainWindow) {
    throw new Error('Please provide a browser window for the autoUpdater.');
  }

  if (!feedURL) {
    throw new Error('Please provide a feed URL for the autoUpdater.');
  }

  autoUpdater.setFeedURL(feedURL);

  autoUpdater.on('error', (err, msg) => {
    console.log(msg);
    mainWindow.send('consoleMsg', msg);
    mainWindow.send('error', msg);
  });

  autoUpdater.on('update-not-available', (msg) => {
    mainWindow.send('updateNotAvailable', msg);
  });

  autoUpdater.on('update-available', () => {
    mainWindow.send('updateAvailable');
  });

  autoUpdater.on('update-downloaded', (e, releaseNotes, releaseName,
                                       releaseDate, updateUrl) => {
    console.log('update ready for install');
    console.log(releaseNotes);
    console.log(releaseName);
    console.log(releaseDate);
    console.log(updateUrl);
    const opts = { releaseNotes, releaseName, releaseDate, updateUrl };
    mainWindow.send('updateReadyForInstall', opts);
  });

// Listen for installUpdate command to install the update
  ipcMain.on('installUpdate', () => {
    autoUpdater.quitAndInstall();
  });

// Listen for checkForUpdate command to manually check for new versions
  ipcMain.on('checkForUpdate', () => {
    autoUpdater.checkForUpdates();
  });

// Check for updates every hour
  autoUpdater.checkForUpdates();
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);

  return autoUpdater;
}

let statusMsg;

export function showUpdateStatus(status = '', msg = '') {
  if (statusMsg) statusMsg.remove();

  statusMsg = app.statusBar.pushMessage({
    msg: `${status ? `${status} ` : ''}${msg}`,
    type: 'warning',
    duration: 6000,
  });
}

let updateReadyDialog;

export function updateReady(opts = {}) {
  if (updateReadyDialog) updateReadyDialog.close();

  let displayData = '';
  Object.entries(opts).forEach(val => {
    displayData += `<b>${val[0]}:</b> <br>${val[1]}<br>`;
  });

  updateReadyDialog = new Dialog({
    title: app.polyglot.t('update.ready.title'),
    message: `${app.polyglot.t('update.ready.msg')}<br><br>${displayData}`,
    buttons: [{
      text: app.polyglot.t('update.install'),
      fragment: 'installUpdate',
    }, {
      text: app.polyglot.t('update.cancel'),
      fragment: 'cancelInstall',
    }],
  }).on('click-installUpdate', () => ipcRenderer.send('installUpdate'))
    .on('click-cancelInstall', () => updateReadyDialog.close())
    .render()
    .open();
}
