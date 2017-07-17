/**
 * When binding event to localServer module from the main (main.js) process, it is critical
 * you use the functions from this module. The reason is that the "browser" part of the app
 * binds to those events, but when the app is refreshed those handlers are lost. If the
 * binding is not cleared from the Local Server module, then when any of those events are
 * triggered, the app will crash. There's no easy way to just clear the handlers bound from
 * the "browser" part of the app, so on an app refresh, we clear all the handlers. But, you will
 * likely want the ones bound from main.js to still be active. So, if you bind them via this module,
 * the module will keep track of those handlers and make sure to re-bind them after they've been
 * unbound.
 */

import { ipcMain } from 'electron';

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
  const curEvents = {
    ...localServerEvents,
  };

  localServerEvents = {};

  if (global.localServer) {
    Object.keys(curEvents).forEach(curEventKey => {
      curEvents[curEventKey]
        .forEach(callback => bindLocalServerEvent(curEventKey, callback));
    });
  }
});

