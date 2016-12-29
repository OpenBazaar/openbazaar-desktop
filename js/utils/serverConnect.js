import { EOL } from 'os';
import { remote, ipcRenderer } from 'electron';
import _ from 'underscore';
import ServerConfig from '../models/ServerConfig';
import Socket from '../utils/Socket';
import $ from 'jquery';
import { Events } from 'backbone';
import app from '../app';
import Dialog from '../views/modals/Dialog';

const events = {
  ...Events,
};

export { events };

const getLocalServer = _.once(() => (remote.getGlobal('localServer')));

let currentConnection = null;
let debugLog = '';

function log(msg) {
  if (typeof msg !== 'string') {
    throw new Error('Please provide a message.');
  }

  if (!msg) return;

  const logMsg = `[SERVER-CONNECT] ${msg}${EOL}`;
  debugLog += logMsg;
  ipcRenderer.send('server-connect-log', logMsg);
}

export function getDebugLog() {
  return debugLog;
}

export function getCurrentConnection() {
  return currentConnection;
}

function socketConnect(socket) {
  // todo: validate args

  const deferred = $.Deferred();

  const onOpen = () => deferred.resolve();
  const onClose = (e) => deferred.reject('failed', e);

  const cancel = () => {
    socket.off(null, onOpen);
    socket.off(null, onClose);
    deferred.reject('canceled');
  };

  socket.on('open', onOpen);
  socket.on('close', onClose);
  socket.connect();

  const promise = deferred.promise();
  promise.cancel = cancel;

  return promise;
}

function authenticate(server) {
  // todo: validate args

  const deferred = $.Deferred();

  const fetchConfig = $.get(`${server.httpUrl}/ob/config`)
    .done(() => deferred.resolve())
    .fail((e) => deferred.reject('failed', e));

  const cancel = () => {
    deferred.reject('canceled');
    fetchConfig.abort();
  };

  const promise = deferred.promise();
  promise.cancel = cancel;

  return promise;
}

export default function connect(server, options = {}) {
  if (!server instanceof ServerConfig) {
    throw new Error('Please provide a server as a ServerConfig instance.');
  }

  const curCon = getCurrentConnection();

  if (curCon && curCon.server.id === server.id &&
    (curCon.status === 'connected' || curCon.status === 'connecting')) {
    throw new Error('You are already connected or connecting to the given server');
  }

  log(`[${server.id.slice(0, 8)}] Will attempt to connect to server "${server.get('name')}"` +
    ` at ${server.get('serverIp')}.`);

  const opts = {
    attempts: 5,
    timeoutBetweenAttempts: 2000,
    maxAttemptTime: 5000,
    // todo: work this one in
    restartDefaultServerOnFirstAttempt: true,
    ...options,
  };

  const deferred = $.Deferred();
  const localServer = getLocalServer();
  let attempt = 1;
  let socket = null;
  let connectAttempt = null;
  let cancel = null;

  const getPromiseData = (data = {}) => {
    const aggregateData = {
      localServer,
      server,
      socket,
      connectAttempt: attempt,
      totalConnectAttempts: opts.attempts,
      ...data,
    };

    if (localServer) aggregateData.localServer = localServer;

    return aggregateData;
  };

  const notify = (e) => {
    currentConnection = {
      ...getPromiseData(e),
      cancel,
    };

    events.trigger(e.status, getPromiseData(e));
    deferred.notify(getPromiseData(e));
  };

  const reject = (e) => {
    currentConnection = {
      ...getPromiseData(e),
      status: 'connect-attempt-failed',
    };

    events.trigger('connect-attempt-failed', getPromiseData(e));
    deferred.reject(getPromiseData(e));
  };

  const resolve = (e) => {
    currentConnection = {
      ...getPromiseData(e),
      status: 'connected',
    };

    events.trigger('connected', getPromiseData(e));
    deferred.resolve(getPromiseData(e));
  };

  cancel = () => {
    if (socket) {
      socket.off();
      socket.close();
    }

    if (connectAttempt) connectAttempt.cancel();
    reject('canceled');
  };

  // If we're not connecting to the local bundled server,
  // then let's ensure it's stopped.
  if (!server.get('default') && localServer && localServer.isRunning()) {
    deferred.notify({
      status: 'stopping-local-server',
      localServer,
    });

    localServer.stop();
  }

  if (curCon && curCon.cancel) {
    curCon.cancel();
  }

  socket = new Socket(server.socketUrl);

  const innerConnect = () => {
    const innerConnectDeferred = $.Deferred();
    let socketConnectAttempt = null;
    const connectCancel = () => {
      if (socketConnectAttempt) socketConnectAttempt.cancel();
      innerConnectDeferred.reject('canceled');
    };

    if (server.get('default') && !localServer.isRunning && !localServer.isStopping) {
      // If we're connecting to the bundled server and the local server is not
      // running or in the process of stopping, we'll start it.
      innerConnectDeferred.notify('starting-local-server');

      localServer.on('start', () => {
        innerConnectDeferred.notify('connecting');

        socketConnectAttempt = socketConnect(socket)
          .done(() => {
            innerConnectDeferred.resolve('connected');
          }).fail((reason, e) => {
            if (reason === 'canceled') {
              innerConnectDeferred.reject('canceled');
            } else {
              innerConnectDeferred.reject('socket-connect-failed', { socketCloseEvent: e });
            }
          });
      });

      localServer.start();
    } else {
      innerConnectDeferred.notify('connecting');

      socketConnectAttempt = socketConnect(socket)
        .done(() => {
          if (server.needsAuthentication()) {
            innerConnectDeferred.notify('authenticating');
            authenticate(server)
              .done(() => innerConnectDeferred.resolve('connected'))
              .fail((reason, e) => {
                innerConnectDeferred.reject('authentication-failed', { failedAuthEvent: e });
              });
          } else {
            innerConnectDeferred.resolve('connected');
          }
        }).fail((reason, e) => {
          if (reason === 'canceled') {
            innerConnectDeferred.reject('canceled');
          } else {
            innerConnectDeferred.reject('socket-connect-failed', { socketCloseEvent: e });
          }
        });
    }

    const promise = innerConnectDeferred.promise();
    promise.cancel = connectCancel;

    return promise;
  };

  let connectAttemptStartTime = null;
  const attemptConnection = () => {
    let maxTimeTimeout = null;
    let nextAttemptTimeout = null;
    connectAttemptStartTime = Date.now();

    const innerConnectAttempt = innerConnect()
      .progress((status, data = {}) => notify({ status, ...data }))
      .done((status, data = {}) => resolve({ status, ...data }))
      .fail((status, data = {}) => {
        clearTimeout(maxTimeTimeout);

        if (status === 'canceled') {
          return;
        } else if (attempt === opts.attempts || status === 'authentication-failed') {
          reject({
            reason: attempt === opts.attempts ? 'unable-to-reach-server' : 'authentication-failed',
            ...data,
          });
        } else {
          const delay = opts.timeoutBetweenAttempts - (Date.now() - connectAttemptStartTime);

          nextAttemptTimeout = setTimeout(() => {
            attempt += 1;
            connectAttempt = attemptConnection();
          }, delay < 0 ? 0 : delay);
        }
      });

    const attemptConnectionCancel = () => {
      reject('canceled');
      clearTimeout(maxTimeTimeout);
      clearTimeout(nextAttemptTimeout);
      innerConnectAttempt.cancel();
    };

    maxTimeTimeout = setTimeout(() => {
      if (innerConnectAttempt.state === 'pending') innerConnectAttempt.cancel();
    }, opts.maxAttemptTime);

    return { cancel: attemptConnectionCancel };
  };

  if (attempt <= opts.attempts) connectAttempt = attemptConnection();

  // wire in some logging
  deferred.progress(e => {
    log(`[${server.id.slice(0, 8)}] Status is "${e.status}" for connect attempt` +
      ` ${e.connectAttempt} of ${e.totalConnectAttempts}.`);
  }).done((e) => {
    log(`[${server.id.slice(0, 8)}] Connected to "${e.server.get('name')}"`);
  }).fail((e) => {
    log(`[${server.id.slice(0, 8)}] Failed to connect to "${e.server.get('name')}"`);
    log(` ====> Reason: ${e.status}`);

    if (e.socketCloseEvent) {
      log(` ====> Code: ${e.socketCloseEvent.code}`);
      if (e.socketCloseEvent.reason) log(`Reason: ${e.socketCloseEvent.reason}`);
    } else if (e.failedAuthEvent) {
      log(` ====> Status: ${e.failedAuthEvent.status}`);
      log(` ====> Status text: ${e.failedAuthEvent.statusText}`);

      if (e.failedAuthEvent.responseText) {
        log(` ====> Response text: ${e.failedAuthEvent.responseText}`);
      }
    }
  });

  const promise = deferred.promise();
  promise.cancel = cancel;

  return promise;
}

// Temporary flow to handle a lost connection.
let noConnectionDialog;

const showNoConnectionDialog = () => {
  if (noConnectionDialog) return;

  noConnectionDialog = new Dialog({
    title: 'No server connection',
    message: 'We were unable to connect to or have lost a connection with the server.',
    buttons: [{
      text: 'Retry',
      fragment: 'retry',
    }],
    dismissOnOverlayClick: false,
    dismissOnEscPress: false,
    showCloseButton: false,
  }).on('click-retry', () => {
    noConnectionDialog.$('.js-retry').addClass('processing');
    connect(app.serverConfigs.activeServer).done(() => location.reload())
      .always(() => {
        if (noConnectionDialog) {
          noConnectionDialog.$('.js-retry').removeClass('processing');
        }
      });
  })
  .render()
  .open();
};

let connectedAtLeastOnce = false;
events.on('connected', (e) => {
  connectedAtLeastOnce = true;
  e.socket.on('close', () => {
    showNoConnectionDialog();
  });
});

events.on('connect-attempt-failed', () => {
  if (!connectedAtLeastOnce) showNoConnectionDialog();
});

ipcRenderer.send('server-connect-ready');
log('Browser has been started or refreshed.');
