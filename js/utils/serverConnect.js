import { EOL } from 'os';
import { remote, ipcRenderer } from 'electron';
import _ from 'underscore';
import $ from 'jquery';
import { Events } from 'backbone';
import Socket from '../utils/Socket';
import { guid } from './';
import app from '../app';
import ServerConfig from '../models/ServerConfig';

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
  // "if (ipcRenderer)" needed to prevent the `npm test` from bombing.
  if (ipcRenderer) ipcRenderer.send('server-connect-log', logMsg);
}

export function getDebugLog() {
  return debugLog;
}

/**
 * Returns an object with data about the current connection, incuding
 * the status (e.g. 'connecting', 'connected'...) and any relevant data
 * (e.g. the Socket instance, the Server Configuration model...).
 */
export function getCurrentConnection() {
  return currentConnection;
}

/**
 * Returns the server config model of the server that you are currently
 * connected to and null if you are not connected to a server.
 */
export function getServer() {
  const curCon = getCurrentConnection();

  if (!curCon || !curCon.server || curCon.status !== 'connected') {
    return null;
  }

  return curCon.server;
}

/**
 * Returns a boolean indicating whether the server is currently using Tor and the client connection
 * is configured to use Tor. This means all server and client traffic should be running through a
 * Tor proxy. If no server is available, will return false, take that into account.
 * @returns {boolean}
 */
export function curConnOnTor() {
  const server = getServer();
  return !!server && getServer().get('useTor') && app.serverConfig.tor;
}

/**
 * Call this method to obtain the socket instance in order to bind socket events.
 * If we are not currently connected to a server, this method will return false.
 * For the most part, you could no-op in that case since as it is now the
 * Connection Modal will overlay the app when there is no connection and any
 * subsequent reconnection will result in the app re-starting.
 */
export function getSocket() {
  const serverConnection = getCurrentConnection();
  let returnVal = false;

  if (serverConnection && serverConnection.status !== 'disconnected') {
    returnVal = serverConnection.socket;
  }

  return returnVal;
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
 * If we're currently connected to a server, this method will disconnect the connection.
 */
export function disconnect() {
  const curCon = getCurrentConnection();
  if (curCon && curCon.socket) curCon.socket.close();
}

let _localServerStartHandlers = [];
let _proxySetHandlers = [];
let boundServerConfigRemove = false;

/**
 * Called to establish a connection with a server. This involves ensuring the
 * local server is running, if attempting to connect to a built-in
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
 * @param {number} [options.minAttemptSpacing=3000] - The minimum number of milliseconds it
 *   should take from the start of one connection attempt until the start of the second on.
 *   This is very important because if a server is is down, in most cases the failure will
 *   be instant, if you don't enforce spacing all the attempts will happen in a fraction
 *   of a second, never giving a server a chance to startup. (Please note this governs the
 *   minimum spacing. The max is governed by maxAttemptTime)
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

  if (!boundServerConfigRemove) {
    boundServerConfigRemove = true;

    // If the config for the server we are connected to is removed, we'll
    // disconnect from the server.
    app.serverConfigs.on('remove', md => {
      const curCon = getCurrentConnection();
      if (curCon && curCon.server && curCon.server.id === md.id) {
        disconnect();
      }
    });
  }

  app.serverConfigs.activeServer = server;
  const curCon = getCurrentConnection();

  const innerLog = (msg = '') => {
    log(`[${server.id.slice(0, 8)}] ${msg}`);
  };

  innerLog(`Will attempt to connect to server "${server.get('name')}"` +
    ` at ${server.get('serverIp')}.`);

  let opts = {
    attempts: 10,
    minAttemptSpacing: 3500,
    maxAttemptTime: 5000,
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
      events.trigger('disconnected', connectionLostEventData);
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

  if (server.get('builtIn') && !localServer) {
    // This should never happen to normal users. The only way it would is if you are a dev
    // and mucking with localStorage and / or fudging the source for the app to masquerade
    // as a bundled app.
    throw new Error('A configuration for a built-in server should only be used on ' +
      'the bundled app.');
  }

  const newServerDataDir = server.get('dataDir');

  let commandLineArgs = ['-v'];

  if (server.get('useTor')) commandLineArgs.push('--tor');
  const torPw = server.get('torPassword');
  if (torPw) {
    commandLineArgs = commandLineArgs.concat(['--torpassword', torPw]);
  }

  if (newServerDataDir && typeof newServerDataDir === 'string') {
    commandLineArgs = commandLineArgs.concat(['-d', newServerDataDir]);
  }

  // If we're not connecting to the local bundled server or it's running with incompatible
  // command line arguments, let's ensure it's stopped.
  if (
    localServer &&
    localServer.isRunning &&
    (
      !server.get('builtIn') ||
      commandLineArgs.join() !== localServer.lastStartCommandLineArgs.join()
    )
  ) {
    deferred.notify({ status: 'stopping-local-server' });
    localServer.stop();

    if (server.get('builtIn') && options.attempts === undefined &&
      options.minAttemptSpacing === undefined &&
      options.maxAttemptTime === undefined) {
      // If we need to wait for a bundled server to shut down before starting a new instance and
      // the user did not pass in override options regarding connection timeouts, we'll bump up the
      // defaults to give the shutting down server more time (it may take up to a few minutes).
      opts = {
        ...opts,
        attempts: 60, // works out to 5 minutes total
        minAttemptSpacing: 5000,
        maxAttemptTime: 5000,
      };
    }
  }

  if (curCon) {
    if (curCon.cancel) curCon.cancel();
    disconnect();
  }

  socket = new Socket(server.socketUrl);

  const innerConnect = () => {
    const innerConnectDeferred = $.Deferred();

    let socketConnectAttempt = null;
    const connectCancel = (reason) => {
      innerConnectDeferred.reject(reason || 'canceled');
      if (socketConnectAttempt) socketConnectAttempt.cancel();
    };

    // The next three are just wrappers around actions on the innerConnectDeferred
    // so they are done in a timeout because we want the promise from this function to
    // be returned first.
    const innerConnectResolve = (...args) => {
      setTimeout(() => innerConnectDeferred.resolve(...args));
    };

    const innerConnectReject = (...args) => {
      setTimeout(() => innerConnectDeferred.reject(...args));
    };

    const innerConnectNotify = (...args) => {
      setTimeout(() => innerConnectDeferred.notify(...args));
    };

    innerConnectNotify('connecting');

    // If we're connecting to the built in server and the existing local server instance is
    // stopping, we'll do nothing until the existing instance stops completely (may be a minute
    // or two)
    let willWaitForLocalServerStop = false;

    if (server.get('builtIn') && localServer.isStopping) {
      const dIndex = localServer.lastStartCommandLineArgs
        .indexOf('-d');

      if (dIndex !== -1) {
        const dataDir = localServer.lastStartCommandLineArgs[dIndex + 1];

        if (dataDir) {
          // This scenario will only play out if you have multiple built-in nodes,
          // which is only possible if you had them migrated from pre-multiwallet
          // nodes.
          willWaitForLocalServerStop = true;
          const stoppingServer = app.serverConfigs
            .findWhere({ dataDir });
          innerConnectNotify('waiting-for-local-server-stop', { stoppingServer });
          innerLog('Waiting for the local server started with ' +
            `"${localServer.lastStartCommandLineArgs}" to stop.`);
        }
      }
    } else {
      if (willWaitForLocalServerStop) innerConnectNotify('local-server-stopped');

      // This is called when either the client Tor proxy has been set or once we've determined
      // it's not needed.
      const onClientTorProxyChecked = () => {
        if (server.get('builtIn') && !localServer.isRunning) {
          const onTorChecked = () => {
            const onLocalServerStart = () => {
              socketConnectAttempt = socketConnect(socket)
                .done(() => {
                  innerConnectResolve('connected');
                }).fail((reason, e) => {
                  if (reason === 'canceled') {
                    innerConnectReject('canceled');
                  } else {
                    innerConnectReject('socket-connect-failed', { socketCloseEvent: e });
                  }
                });
            };

            innerConnectNotify('starting-local-server');
            localServer.start(commandLineArgs);

            // Remove any previous start handlers that this module may have bound. Not
            // removing them all, because other modules bind to 'start' and we don't
            // want to remove their handlers.
            _localServerStartHandlers.forEach(handler => localServer.off('start', handler));
            _localServerStartHandlers = [onLocalServerStart];

            localServer.on('start', onLocalServerStart);
          };

          if (server.get('confirmedTor') && !server.get('useTor')) {
            onTorChecked();
          } else {
            const getServerStatusPid = localServer.getServerStatus();

            localServer.on('getServerStatusSuccess', data => {
              if (data.pid === getServerStatusPid) {
                if (data.torAvailable && !server.get('useTor')) {
                  innerConnectReject('tor-not-configured');
                } else if (!data.torAvailable && server.get('useTor')) {
                  innerConnectReject('tor-not-available');
                } else {
                  onTorChecked();
                }
              }
            });

            localServer.on('getServerStatusFail', data => {
              if (data.pid === getServerStatusPid) {
                innerConnectReject('unable-to-get-server-status');
              }
            });
          }
        } else {
          socketConnectAttempt = socketConnect(socket)
            .done(() => {
              if (server.needsAuthentication()) {
                innerConnectNotify('authenticating');
                authenticate(server)
                  .done(() => innerConnectResolve('connected'))
                  .fail((reason, e) => {
                    innerConnectReject('authentication-failed', { failedAuthEvent: e });
                  });
              } else {
                innerConnectResolve('connected');
              }
            }).fail((reason, e) => {
              if (reason === 'canceled') {
                innerConnectReject('canceled');
              } else {
                innerConnectReject('socket-connect-failed', { socketCloseEvent: e });
              }
            });
        }
      };

      if (server.get('useTor')) {
        innerConnectNotify('setting-tor-proxy');
        innerLog(`Activating a proxy at socks5://${server.get('torProxy')}`);
        const setProxyId = guid();

        const onProxySet = (e, id) => {
          if (id === setProxyId) {
            innerConnectNotify('tor-proxy-set');
            onClientTorProxyChecked();
          }
        };

        ipcRenderer.send('set-proxy', setProxyId, `socks5://${server.get('torProxy')}`);
        _proxySetHandlers.forEach(handler => ipcRenderer.removeListener('proxy-set', handler));
        ipcRenderer.on('proxy-set', onProxySet);
        _proxySetHandlers = [onProxySet];
      } else {
        innerConnectNotify('clearing-tor-proxy');
        innerLog('Clearing any proxy that may be set.');
        const setProxyId = guid();
        ipcRenderer.send('set-proxy', setProxyId, '');

        const onProxySet = (e, id) => {
          if (id === setProxyId) {
            innerConnectNotify('tor-proxy-cleared');
            onClientTorProxyChecked();
          }
        };

        _proxySetHandlers.forEach(handler => ipcRenderer.removeListener('proxy-set', handler));
        ipcRenderer.on('proxy-set', onProxySet);
        _proxySetHandlers = [onProxySet];
      }
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
          status === 'outer-connect-attempt-canceled' ||
          status === 'tor-not-configured' ||
          status === 'tor-not-available') {
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
          const delay = opts.minAttemptSpacing - (Date.now() - connectAttemptStartTime);

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
    innerLog(`Status is "${e.status}" for connect attempt` +
      ` ${e.connectAttempt} of ${e.totalConnectAttempts}.`);
  }).done((e) => {
    innerLog(`Connected to "${e.server.get('name')}"`);

    e.socket.on('close', () => {
      innerLog(`Disconnected from "${e.server.get('name')}"`);
    });
  }).fail((e) => {
    innerLog(`Failed to connect to "${e.server.get('name')}"`);
    innerLog(`====> Reason: ${e.status}`);

    if (e.socketCloseEvent) {
      innerLog(`====> Code: ${e.socketCloseEvent.code}`);
      if (e.socketCloseEvent.reason) log(`Reason: ${e.socketCloseEvent.reason}`);
    } else if (e.failedAuthEvent) {
      innerLog(`====> Status: ${e.failedAuthEvent.status}`);
      innerLog(`====> Status text: ${e.failedAuthEvent.statusText}`);

      if (e.failedAuthEvent.responseText) {
        innerLog(`====> Response text: ${e.failedAuthEvent.responseText}`);
      }
    }
  });

  const promise = deferred.promise();
  promise.cancel = cancel;

  return promise;
}

// "if (ipcRenderer)" needed to prevent the `npm test` from bombing.
if (ipcRenderer) ipcRenderer.send('server-connect-ready');
log('Browser has been started or refreshed.');
