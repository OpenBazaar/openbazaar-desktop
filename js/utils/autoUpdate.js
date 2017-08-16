import $ from 'jquery';
import { ipcRenderer } from 'electron';
import app from '../app';
import Dialog from '../views/modals/Dialog';

let statusMsg;
let removeStatusMsgTimout;

export function showUpdateStatus(status = '', msg = '') {
  const fullmsg = `${status ? `${status} ` : ''}${msg}`;

  clearTimeout(removeStatusMsgTimout);

  if (!statusMsg) {
    statusMsg = app.statusBar.pushMessage({
      msg: fullmsg,
      type: 'warning',
      duration: 9999999999,
    });
  } else {
    statusMsg.update(fullmsg);
  }

  // updates may arrive multiple times, manually remove the message when no new message
  // arrives for 6 seconds
  removeStatusMsgTimout = setTimeout(() => {
    statusMsg.remove();
    statusMsg = null;
  }, 6000);

  return statusMsg;
}

let updateReadyDialog;

export function updateReady(opts = {}) {
  if (updateReadyDialog) updateReadyDialog.close();

  let displayData = '';
  $.each(opts, (key, val) => {
    displayData += `<b>${key}:</b> <br>${val}<br>`;
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
