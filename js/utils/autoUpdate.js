import { ipcRenderer } from 'electron';
import app from '../app';
import Dialog from '../views/modals/Dialog';


let statusMsg;

export function showUpdateStatus(status = '', msg = '') {
  const fullmsg = `${status ? `${status} ` : ''}${msg}`;

  if (!statusMsg) {
    statusMsg = app.statusBar.pushMessage({
      msg: fullmsg,
      type: 'warning',
      duration: 6000,
    });
  } else {
    statusMsg.update(fullmsg);
  }
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
