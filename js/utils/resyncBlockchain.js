import $ from 'jquery';
import { getServer } from './serverConnect';
import walletCurs from '../data/walletCurrencies';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import { Events } from 'backbone';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let walletCurCodes = [];
let server;

// If you change this, be sure to change anywhere in the GUI you may have output how
// long its unavailable.
const resyncInactiveTime = 1000 * 60;

function checkCoinType(coinType) {
  if (typeof coinType !== 'string' && !coinType) {
    throw new Error('Please provide a coinType.');
  }
}

function __isResyncAvailable(coinType) {
  checkCoinType(coinType);

  if (server) {
    let lastBlockchainResync = server.get('lastBlockchainResync');
    lastBlockchainResync = typeof lastBlockchainResync === 'object' ?
      lastBlockchainResync[coinType] : null;
    if (lastBlockchainResync && typeof lastBlockchainResync === 'number' &&
      (Date.now() - (new Date(lastBlockchainResync).getTime())) < resyncInactiveTime) {
      return false;
    }
  } else {
    throw new Error('A server connection is required.');
  }

  return true;
}

let _isResyncAvailable = {};

function setResyncAvailable(coinType, bool = __isResyncAvailable(coinType)) {
  if (resyncInactiveTime <= 0) return;

  checkCoinType(coinType);

  if (typeof bool !== 'boolean') {
    throw new Error('Please provide bool as a boolean.');
  }

  if (bool !== _isResyncAvailable[coinType]) {
    _isResyncAvailable[coinType] = bool;
    events.trigger('changeResyncAvailable', {
      available: bool,
      coinType,
    });
  }
}

let lastResyncExpiresTimeouts = {};

function setlastResyncExpiresTimeouts(coinType) {
  checkCoinType(coinType);
  clearTimeout(lastResyncExpiresTimeouts[coinType]);
  if (!server) return;

  let lastBlockchainResync = server.get('lastBlockchainResync');
  lastBlockchainResync = typeof lastBlockchainResync === 'object' ?
    lastBlockchainResync[coinType] : null;

  if (typeof lastBlockchainResync === 'number') {
    const fromNow = (new Date(lastBlockchainResync)).getTime() + resyncInactiveTime - Date.now();
    if (fromNow > 0) {
      lastResyncExpiresTimeouts[coinType] = setTimeout(() => {
        setResyncAvailable(coinType);
      }, fromNow + (1000 * 10));
      // Giving a 10s buffer in case the timeout is a little fast
    }
  }
}

let initialized = false;

export function init() {
  server = getServer();

  if (!server) {
    throw new Error('This module must be initialized when an active server connection ' +
      'is present');
  }

  if (typeof app.serverConfig !== 'object') {
    throw new Error('This module requires the server config to be set on the app object. ' +
      'Ensure that init is not called before that point.');
  }

  walletCurCodes =
    walletCurs.map(cur => (app.serverConfig.testnet ? cur.testnetCode : cur.code));

  walletCurCodes.forEach(cur => {
    setResyncAvailable(cur);
    setlastResyncExpiresTimeouts(cur);
  });

  _isResyncAvailable = walletCurCodes.reduce((acc, cur) => {
    acc[cur] = __isResyncAvailable(cur);
    return acc;
  }, {});

  lastResyncExpiresTimeouts = walletCurCodes.reduce((acc, cur) => {
    acc[cur] = null;
    return acc;
  }, {});

  initialized = true;
}

function ensureInitialized() {
  if (!initialized) init();
}

/**
 * Resync will be disabled if one was executed by this module less than the time specificed
 * in resyncInactiveTime. resyncBlockchain to remain flexible does not enforce this.
 * If you are exposing a resync function in the GUI, you probably want to disable it based
 * on this function.
 */
export function isResyncAvailable(coinType) {
  ensureInitialized();
  checkCoinType(coinType);
  return !!_isResyncAvailable[coinType];
}

const resyncPosts = {};

export default function resyncBlockchain(coinType) {
  ensureInitialized();
  checkCoinType(coinType);

  if (resyncPosts[coinType] && resyncPosts[coinType].state() === 'pending') {
    return resyncPosts[coinType];
  }

  const _server = server;

  const post = resyncPosts[coinType] =
    $.post(app.getServerUrl(`wallet/resyncblockchain/${coinType}`))
      .fail((xhr) => {
        if (xhr.statusText === 'abort') return;
        const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';
        openSimpleMessage(
          app.polyglot.t('resyncFail'),
          failReason);
        events.trigger('resyncFail', {
          xhr: post,
          coinType,
        });
      })
      .done(() => {
        events.trigger('resyncComplete', {
          xhr: post,
          coinType,
        });

        if (_server) {
          let lastBlockchainResync = _server.get('lastBlockchainResync');
          lastBlockchainResync = typeof lastBlockchainResync === 'object' ?
            lastBlockchainResync : {};
          lastBlockchainResync[coinType] = (new Date()).getTime();
          const serverSave = _server.save({ lastBlockchainResync });

          if (serverSave) {
            serverSave.done(() => {
              if (server === _server) {
                setResyncAvailable(coinType);
                Object.keys(lastResyncExpiresTimeouts)
                  .forEach(cur => setlastResyncExpiresTimeouts(cur));
              }
            });
          } else {
            console.error('There was an error updating the local server config with the ' +
              'last resync time.');
            console.dir(_server.validationError);
          }
        }
      });

  events.trigger('resyncing', {
    xhr: post,
    coinType,
  });

  return post;
}

export function isResyncingBlockchain(coinType) {
  ensureInitialized();
  checkCoinType(coinType);

  return resyncPosts[coinType] &&
    resyncPosts[coinType].state() === 'pending' || false;
}
