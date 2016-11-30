import app from '../app';
import { events as localServerEvents, isRunning } from '../utils/localServer';

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
  console.log('check it');
  if (isRunning()) {
    console.log('one more time');
    pushPublishingStatus({
      msg: 'Local server started...',
    });
  }

  // todo: trans to the late, translate, don't hate
  localServerEvents.on('start', () => {
    console.log('check it - we start');
    pushPublishingStatus({
      msg: 'Local server started...',
    });
  });

  localServerEvents.on('stop', () => {
    console.log('check it - we stop');
    pushPublishingStatus({
      msg: 'Local server stopped...',
    });
  });
}
