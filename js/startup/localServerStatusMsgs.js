import app from '../app';
import { remote } from 'electron';

let statusMsg = null;
let removeTimer;

// Creates / updates a status message about the local server's state
function pushPublishingStatus(msg) {
  if (!msg && typeof msg !== 'object') {
    throw new Error('Please provide a msg as an object.');
  }

  msg.duration = 99999999999999;

  if (!statusMsg) {
    statusMsg = app.statusBar.pushMessage({
      ...msg,
    });
  } else {
    clearTimeout(removeTimer);
    statusMsg.update(msg);
  }

  removeTimer = setTimeout(() => {
    statusMsg.remove();
    statusMsg = null;
  }, 3000);
}

export function init() {
  if (!remote.getGlobal('localServer')) return;

  const localServer = remote.getGlobal('localServer');

  if (localServer.isRunning) {
    pushPublishingStatus({
      msg: 'Local server started.',
    });
  } else if (localServer.lastCloseCode !== undefined &&
    localServer.lastCloseCode) {
    pushPublishingStatus({
      msg: `Local server closed with error code ${localServer.lastCloseCode}.`,
      type: 'warning',
    });
  }

  // todo: trans to the late, translate, don't hate
  localServer.on('start', () => {
    pushPublishingStatus({
      msg: 'Local server started.',
    });
  });

  localServer.on('close', (e) => {
    const msgObj = {};
    let msg = 'Local server closed';

    if (e.code) {
      msg += ` with error code ${e.code}.`;
      msgObj.type = 'warning';
    } else {
      msg += '.';
    }

    msgObj.msg = msg;
    pushPublishingStatus(msgObj);
  });
}
