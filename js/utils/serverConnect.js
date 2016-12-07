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

// function startLocalServer() {
//   const deferred = $.Deferred();

//   if (getLocalServer().isRunning) {
//     throw new Error('Local server is already running.');
//   }

//   getLocalServer().on('start', )
//   getLocalServer().start();

//   return deferred.promise();
// }

function socketConnect(server, socket, deferred, localServer) {
  // todo: validate args

  const eventData = {
    server,
    socket,
  };

  if (localServer) eventData.localServer = localServer;

  const onOpen = () => {
    deferred.resolve({
      status: 'connected',
      ...eventData,
    });
  };

  const onClose = (e) => {
    console.log('closed moo check that yo');
    window.moo = e;

    deferred.reject({
      status: 'connection-failed',
      socketCloseEvent: e,
      ...eventData,
    });
  };

  const cancel = () => {
    socket.off(null, onOpen);
    socket.off(null, onClose);
  };

  deferred.notify({
    status: 'connecting',
    ...eventData,
  });

  socket.on('open', onOpen);
  socket.on('close', onClose);
  socket.connect(server.socketUrl);

  return {
    cancel,
  };
}

function innerConnect(server, deferred, options) {
  // todo: validate args
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
    ...options,
  };

  const deferred = $.Deferred();
  const localServer = getLocalServer();

  if (curCon) {
    curCon.close();

    if (curCon.server.get('default')) {
      deferred.notify({
        status: 'stopping-local-server',
        localServer,
      });

      localServer.stop();
    }
  }

  const socket = new Socket(server.socketUrl);

  if (server.get('default')) {
    if (!localServer.isRunning) {
      deferred.notify({
        status: 'starting-local-server',
        localServer,
      });

      localServer.on('start', () => {
        socketConnect(server, socket, deferred, {
          server,
          localServer,
          socket,
        });
      });

      localServer.start();
    } else {
      socketConnect(server, socket, deferred, {
        server,
        localServer,
        socket,
      });
    }
  }

  return deferred.promise();
}
