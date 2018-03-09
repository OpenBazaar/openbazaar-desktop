// Putting start-up related one offs here that are too small for their own module and
// aren't appropriate to be in any existing module

import { screen, ipcRenderer } from 'electron';
import { platform } from 'os';
import $ from 'jquery';
import { getBody } from '../utils/selectors';
import { getCurrentConnection } from '../utils/serverConnect';
import app from '../app';

export function fixLinuxZoomIssue() {
  // fix zoom issue on Linux hiDPI
  if (process.platform === 'linux') {
    let scaleFactor = screen.getPrimaryDisplay().scaleFactor;

    if (scaleFactor === 0) {
      scaleFactor = 1;
    }

    getBody().css('zoom', 1 / scaleFactor);
  }
}

/**
 * This function will accept requests from the main process to shutdown the OB server daemon.
 * This should only be called on the bundled app on windows. For Linux and OSX, the localServer
 * module is able to shut down the daemon via OS signals.
 */
export function handleServerShutdownRequests() {
  ipcRenderer.on('server-shutdown', () => {
    if (platform() !== 'win32') {
      ipcRenderer.send('server-shutdown-fail',
        { reason: 'Not on windows. Use childProcess.kill instead.' });
      return;
    }

    const curConn = getCurrentConnection();

    if (!curConn || curConn.status !== 'connected') {
      ipcRenderer.send('server-shutdown-fail',
        { reason: 'No server connection' });
      return;
    }

    try {
      $.post(app.getServerUrl('ob/shutdown/'))
        .fail(xhr => ipcRenderer.send('server-shutdown-fail', {
          xhr,
          reason: xhr && xhr.responseJSON && xhr.responseJSON.reason || '',
        }));
    } catch (e) {
      ipcRenderer.send('server-shutdown-fail',
        { reason: e.toString() });
      return;
    }
  });
}
