import $ from 'jquery';
import {
  getServer,
  events as serverConnectEvents,
} from './serverConnect';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import { Events } from 'backbone';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let server = getServer();

// If you change this, be sure to change anywhere in the GUI you may have output how
// long its unavailable (e.g. Advanced Settings).
// const resyncInactiveTime = 1000 * 60 * 60 * 1;
const resyncInactiveTime = 1000 * 30; // 30 secs

/**
 * Resync will be disabled if one was executed by this module less than the time specificed
 * in this.resyncInactiveTime. resyncBlockchain to remain flexible does not enforce this.
 * If you are exposing resync function in the GUI, you probably want to disable them based
 * on this function.
 */
function __isResyncAvailable() {
  if (server) {
    const lastBlockchainResync = server.get('lastBlockchainResync');
    if (lastBlockchainResync && typeof lastBlockchainResync === 'number' &&
      (Date.now() - (new Date(lastBlockchainResync).getTime())) < resyncInactiveTime) {
      return false;
    }
  }

  return true;
}

let _isResyncAvailable = __isResyncAvailable();

function setResyncAvailable(bool = true) {
  if (typeof bool !== 'boolean') {
    throw new Error('Please provide bool as a boolean.');
  }

  if (bool !== _isResyncAvailable) {
    _isResyncAvailable = bool;
    events.trigger('changeResyncAvailable', bool);
  }
}

let lastResyncExpiresTimeout = null;

function setLastResyncExpiresTimeout() {
  clearTimeout(lastResyncExpiresTimeout);
  if (!server) return;

  const lastBlockchainResync = server.get('lastBlockchainResync');

  if (typeof lastBlockchainResync === 'number') {
    const fromNow = (new Date(lastBlockchainResync)).getTime() + resyncInactiveTime - Date.now();
    lastResyncExpiresTimeout = setTimeout(() => {
      setResyncAvailable(__isResyncAvailable(lastBlockchainResync));
    // }, fromNow + (1000 * 60));
    }, fromNow);
    // Giving a 1m buffer in case the timeout is a little fast
  }
}

function onChangeLastBlockchainResync(md, lastBlockchainResync) {
  setResyncAvailable(__isResyncAvailable(lastBlockchainResync));
  setLastResyncExpiresTimeout();
}

function onConnected(_server) {
  if (!_server) return;
  server = _server;
  setResyncAvailable(__isResyncAvailable(_server.get('lastBlockchainResync')));
  // for some reason this is not firing so the handler is being manually triggered in
  // resyncBlockchain
  // _server.on('change:lastBlockchainResync', () => onChangeLastBlockchainResync);
  setLastResyncExpiresTimeout();
}

if (server) onConnected(server);

serverConnectEvents.on('connected', conn => onConnected(conn.server));

serverConnectEvents.on('disconnected', conn => {
  server = null;
  clearTimeout(lastResyncExpiresTimeout);
  if (conn.server) {
    conn.server.off(null, onChangeLastBlockchainResync);
  }
});

export function isResyncAvailable() {
  return _isResyncAvailable;
}

let resyncPost;

export default function resyncBlockchain() {
  if (resyncPost && resyncPost.state() === 'pending') return resyncPost;

  const _server = server;

  const post = $.post(app.getServerUrl('wallet/resyncblockchain'))
    .fail((xhr) => {
      if (xhr.statusText === 'abort') return;
      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
      openSimpleMessage(
        app.polyglot.t('resyncFail'),
        failReason);
      events.trigger('resyncFail', { xhr: post });
    })
    .done(() => {
      events.trigger('resyncComplete', { xhr: post });
      const lastBlockchainResync = (new Date()).getTime();

      if (_server) {
        _server.save({ lastBlockchainResync })
          .done(() => {
            // for some reason the change event isn't firing, so for now we'll
            // just manually trigger it
            if (server === _server) {
              onChangeLastBlockchainResync(_server, lastBlockchainResync);
            }
          });
      }
    });

  events.trigger('resyncing', { xhr: post });

  return post;
}

export function isResyncingBlockchain() {
  return resyncPost && resyncPost.state() === 'pending';
}
