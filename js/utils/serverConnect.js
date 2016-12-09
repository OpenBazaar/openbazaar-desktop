import { remote } from 'electron';
import _ from 'underscore';
import ServerConfig from '../models/ServerConfig';
import Socket from '../utils/Socket';
import $ from 'jquery';
// import { Events } from 'backbone';
// import app from '../app';

// const events = {
//   ...Events,
// };

let currentConnection = null;

const getLocalServer = _.once(() => (remote.getGlobal('localServer')));

// function setCurrentConnection(state = {}) {
//   // todo: doc additive nature
//   currentConnection = {
//     ...currentConnection,
//     ...state,
//   };
// }

// function clearCurrentConnection() {
//   currentConnection = null;
// }

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

export function connect(server, options = {}) {
  if (!server instanceof ServerConfig) {
    throw new Error('Please provide a server as a ServerConfig instance.');
  }

  const curCon = getCurrentConnection();

  if (curCon && curCon.server.id === server.id) {
    throw new Error('You are already connected to the given server');
  }

  const opts = {
    attempts: 3,
    timeoutBetweenAttempts: 3000,
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

  const getPromiseData = (status, data = {}) => {
    const aggregateData = {
      status,
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

  const notify = (...args) => deferred.notify(getPromiseData(...args));
  const reject = (...args) => deferred.reject(getPromiseData(...args));
  const resolve = (...args) => deferred.resolve(getPromiseData(...args));

  const cancel = () => {
    if (socket) {
      socket.off();
      socket.close();
    }

    if (connectAttempt) connectAttempt.cancel();
    reject('canceled');
  };

  if (curCon) {
    curCon.cancel();

    // if (curCon.server.get('default')) {
    //   deferred.notify({
    //     status: 'stopping-local-server',
    //     localServer,
    //   });

    //   localServer.stop();
    // }
  }

  currentConnection = { cancel };

  socket = new Socket(server.socketUrl);

  const innerConnect = () => {
    const innerConnectDeferred = $.Deferred();
    let socketConnectAttempt = null;
    const connectCancel = () => {
      if (socketConnectAttempt) socketConnectAttempt.cancel();
      innerConnectDeferred.reject('canceled');
    };

    if (server.get('default') && !localServer.isRunning) {
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
          // innerConnectDeferred.resolve('connected');
          if (server.needsAuthentication()) {
            authenticate(server)
              .done(() => innerConnectDeferred.resolve('connected'))
              .fail((reason, e) => {
                innerConnectDeferred.reject('authentiction-failed', { failedAuthEvent: e });
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
      .progress((status, data = {}) => notify(status, data))
      .done((status, data = {}) => resolve(status, data))
      .fail((status, data = {}) => {
        clearTimeout(maxTimeTimeout);

        if (status === 'canceled') {
          return;
        } else if (attempt === opts.attempts || status === 'authentiction-failed') {
          reject(status, data);
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

  const promise = deferred.promise();
  promise.cancel = cancel;

  return promise;
}
