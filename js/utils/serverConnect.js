import { EOL } from 'os';
import { remote, ipcRenderer } from 'electron';
import _ from 'underscore';
import app from '../app';
import ServerConfig from '../models/ServerConfig';
import Socket from '../utils/Socket';
import $ from 'jquery';
import { Events } from 'backbone';

/*
  The module is used to establish a connection with a server as well as monitor
  the state of any current connection.

  To establish a connection call connect().

  To get a snapshot of a current connection, call getCurrentConnection().

  To be informed of the state of a connection as it changes - If you initiated the
  connection (via a call to connect()),you can use the promise handlers (progress,
  done, fail) of the promise returned via the connect() call. Alternatively,
  particularly if you weren't the one that made the connect() call, you can bind
  to the { events } object exported in this module, which will fire relevant events
  ('connecting', 'connected', etc...).
*/

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

/**
 * Returns an object with data about the current connection, incuding
 * the status (e.g. 'connecting', 'connected'...) and any relevant data
 * (e.g. the Socket instance, the Server Configuration model...).
 *
 * If you're looking to bind to Socket events, you would call this method
 * and then bind to the Socket instance that's returned. Keep in mind that
 * until the first connection is made, this method will return null, in which
 * case you'd wanted to wait until the 'connected' event to do your binding.
 *
 * But, since the app won't proceed out of Start.js, until a connection is
 * made, it's really only in Start.js that you need to wait for the event
 * and beyond Start.js you should just be able to get the socket via this
 * method.
 */
export function getCurrentConnection() {
  return currentConnection;
}

function socketConnect(socket) {
  // todo: validate args

  const deferred = $.Deferred();

  const onOpen = () => deferred.resolve();
  const onClose = (e) => deferred.reject('failed', e);

  const cancel = () => {
    socket.close();
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

/**
 * Called to establish a connection with a server. This involves ensuring the
 * local server is running, if attempting to connect to the Default
 * (i.e. local bundled) connection. It also involves opening a websocket connection
 * with the server. Additionally, if the configuration requires authentication,
 * it will call a server endpoint to make sure authentication was successful.
 *
 * @param {object} server - A ServerConfig instance representing the server you want to
 *   connect to.
 * @param {object} [options={}] - Options determining certain behavior of the connection
 *   process.
 * @param {number} [options.attempts=2] - The number of connection attempts to make. During
 *   the initial connection process (e.g. at startup), it is useful to have multiple attempts
 *   since the server may still be in the process of starting up.
 * @param {number} [options.timeoutBetweenAttempts=2000] - Number of milliseconds to wait
 *   after an unsuccessful connection attempt before starting the next one. If a server is
 *   is down, in most cases the failure will be instant, so it is important to have a timeout
 *   inbetween connection attempts, otherwise they will all happen in a fraction of a second,
 *   never giving a server a chance to startup.
 * @param {number} [options.maxAttemptTime=5000] - The maximum amount of milliseconds before
 *   giving up on a connection attempt (and moving on to the next one if there is one) and
 *   considering it a failure. This is particularly important if you are attempting to connect
 *   to a remote server with a non numeric ServerIp value. Since it's trying to get the name
 *   via DNS, it will take over a minute before it fails. The recommendation is to not make this
 *   value too large during start-up, or you risk making a very long start-up sequence,
 *   particularly if you have multiple attempts. In the Connection Management modal, the value
 *   could be much higher and the user could always cancel the attempt if they feel it is
 *   taking too long.
 * @return {object} A promise object will be returned that will allow you
 *   to monitor the progress and result of the connection via progress, done
 *   and fail handlers. The object will also include a cancel function, whereby
 *   you can cancel the connection attempt.
 */
export default function connect(server, options = {}) {
  if (!server instanceof ServerConfig) {
    throw new Error('Please provide a server as a ServerConfig instance.');
  }

  app.serverConfigs.activeServer = server;
  const curCon = getCurrentConnection();

  if (curCon && curCon.server.id === server.id &&
    (curCon.status === 'connected' || curCon.status === 'connecting')) {
    throw new Error('You are already connected or connecting to the given server');
  }

  log(`[${server.id.slice(0, 8)}] Will attempt to connect to server "${server.get('name')}"` +
    ` at ${server.get('serverIp')}.`);

  const opts = {
    attempts: 2,
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

  const getPromiseData = (data = {}, getPromiseOpts = {}) => {
    const getPromiseDataOpts = {
      includeAttemptData: true,
      ...getPromiseOpts,
    };

    let aggregateData = {
      localServer,
      server,
      socket,
      ...data,
    };

    if (getPromiseDataOpts.includeAttemptData) {
      aggregateData = {
        ...aggregateData,
        connectAttempt: attempt,
        totalConnectAttempts: opts.attempts,
      };
    }

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
    const data = getPromiseData(e);

    currentConnection = {
      ...data,
      status: 'connected',
    };

    data.socket.on('close', (connectionLostE) => {
      const connectionLostEventData = getPromiseData({ socketCloseEvent: connectionLostE },
        { includeAttemptData: false });
      events.trigger('disconnect', connectionLostEventData);
      if (!currentConnection || currentConnection.socket === data.socket) {
        currentConnection = {
          ...data,
          status: 'disconnected',
        };
      }
    });

    events.trigger('connected', getPromiseData(e));
    deferred.resolve(getPromiseData(e));
  };

  cancel = () => {
    if (connectAttempt) connectAttempt.cancel();
  };

  // If we're not connecting to the local bundled server,
  // then let's ensure it's stopped.
  if (!server.get('default') && localServer && localServer.isRunning) {
    deferred.notify({
      status: 'stopping-local-server',
      localServer,
    });

    localServer.stop();
  }

  if (curCon) {
    if (curCon.cancel) curCon.cancel();
    if (curCon.socket) curCon.socket.close();
  }

  socket = new Socket(server.socketUrl);

  const innerConnect = () => {
    const innerConnectDeferred = $.Deferred();
    let socketConnectAttempt = null;
    const connectCancel = (reason) => {
      innerConnectDeferred.reject(reason || 'canceled');
      if (socketConnectAttempt) socketConnectAttempt.cancel();
    };

    if (server.get('default') && !localServer) {
      // This should never happen to normal users. The only way it would is if you are a dev
      // and mucking with localStorage and / or fudging the source for the app to masquerade
      // as a bundled app.
      throw new Error('The default configuration should only be used on the bundled app.');
    }

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
        if (attempt === opts.attempts || status === 'authentication-failed' ||
          status === 'outer-connect-attempt-canceled') {
          let reason;

          if (status === 'socket-connect-failed') {
            reason = 'unable-to-reach-server';
          } else if (status === 'outer-connect-attempt-canceled') {
            reason = 'canceled';
          } else {
            reason = status;
          }

          reject({
            reason,
            ...data,
          });
        } else {
          const delay = opts.timeoutBetweenAttempts - (Date.now() - connectAttemptStartTime);

          nextAttemptTimeout = setTimeout(() => {
            attempt += 1;
            connectAttempt = attemptConnection();
          }, delay < 0 ? 0 : delay);
        }
      })
      .always(() => clearTimeout(maxTimeTimeout));

    const attemptConnectionCancel = () => {
      reject({ reason: 'canceled' });
      clearTimeout(maxTimeTimeout);
      clearTimeout(nextAttemptTimeout);
      innerConnectAttempt.cancel('outer-connect-attempt-canceled');
    };

    maxTimeTimeout = setTimeout(() => {
      if (innerConnectAttempt.state() === 'pending') innerConnectAttempt.cancel('timed-out');
    }, opts.maxAttemptTime);

    return { cancel: attemptConnectionCancel };
  };

  connectAttempt = attemptConnection();

  // wire in some logging
  deferred.progress(e => {
    log(`[${server.id.slice(0, 8)}] Status is "${e.status}" for connect attempt` +
      ` ${e.connectAttempt} of ${e.totalConnectAttempts}.`);
  }).done((e) => {
    log(`[${server.id.slice(0, 8)}] Connected to "${e.server.get('name')}"`);

    e.socket.on('close', () => {
      const logMsg = `[${e.server.id.slice(0, 8)}] Disconnected from ` +
        `"${e.server.get('name')}"`;
      log(logMsg);
    });
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

ipcRenderer.send('server-connect-ready');
log('Browser has been started or refreshed.');
