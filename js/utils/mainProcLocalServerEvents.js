import { ipcMain } from 'electron';
// todo: doc me up
// todo: unit test

let localServerEvents = {};

// For simplicity, we won't be proxying on through the 'context'. If you
// want to bind a context to your callback, please use the native bind()
// function.
export function bindLocalServerEvent(event, callback, localServer = global.localServer) {
  if (!localServer) {
    throw new Error('The localServer is not set.');
  }

  if (!event) {
    throw new Error('Please provide an event name.');
  }

  if (!callback) {
    throw new Error('Please provide a callback function.');
  }

  localServer.on(event, callback);
  localServerEvents[event] = localServerEvents[event] || [];
  localServerEvents[event].push(callback);
}

export function unbindLocalServerEvent(event, callback, localServer = global.localServer) {
  if (!localServer) {
    throw new Error('The localServer is not set.');
  }

  localServer.off(event, callback);

  if (event && !callback) {
    // just event - remove all callbacks for that event
    delete localServerEvents[event];
  } else if (event && callback) {
    // event and callback - remove that callback for that event
    if (localServerEvents[event]) {
      const callbackIndex = localServerEvents[event].indexOf(callback);
      if (callbackIndex !== -1) localServerEvents[event].splice(callbackIndex, 1);
    }
  } else if (callback) {
    // just callback - remove that callback for all events
    Object.keys(localServerEvents).forEach(localServerEventKey => {
      const callbackIndex = localServerEvents[localServerEventKey].indexOf(callback);
      if (callbackIndex !== -1) localServerEvents[event].splice(callbackIndex, 1);
    });
  } else {
    localServerEvents = {};
  }
}

// Revive any main process handlers the renderer process blew away on a refresh.
ipcMain.on('renderer-cleared-local-server-events', () => {
  if (global.localServer) {
    Object.keys(localServerEvents).forEach(localServerEventKey => {
      localServerEvents[localServerEventKey]
        .forEach(callback => bindLocalServerEvent(localServerEventKey, callback));
    });
  }
});

