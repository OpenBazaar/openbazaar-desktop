import $ from 'jquery';
import { integerToDecimal } from './currency';
import { getSocket, events as serverConnectEvents } from './serverConnect';
import app from '../app';

export const feeLevels = [
  'PRIORITY',
  'NORMAL',
  'ECONOMIC',
];

const cacheExpires = 1000 * 60 * 5;
const estimateFeeCache = new Map();
let watchingTransactions = false;

function onSocket(e) {
  if (e.jsonData.wallet && !e.jsonData.wallet.height) {
    estimateFeeCache.clear();
  }
}

/**
 * Since a new transactions will potentially affect inputs and change the estimated fee,
 * we'll clear the cache when any new transactions come.
 */
function watchTransactions() {
  if (watchingTransactions) return;
  watchingTransactions = true;

  const socket = getSocket();
  if (!socket) return;

  socket.on('message', onSocket);

  // in case we connect to a new server
  this.listenTo(serverConnectEvents, 'connected', e => {
    socket.off(null, onSocket);
    e.socket.on('message', onSocket);
  });
}

/**
 * Will estimate a fee based on the current state of the wallet.
 *
 * @param {string} feeLevel - The fee level
 * @param {amount} number - The amount of the transaction in Bitcoin.
 */
export default function estimateFee(feeLevel, amount) {
  if (feeLevels.indexOf(feeLevel) === -1) {
    throw new Error(`feelevel must be one of ${feeLevels.join(', ')}`);
  }

  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number.');
  }

  if (!watchingTransactions) watchTransactions();

  let deferred;
  const cacheKey = `${feeLevel}-${amount}`;
  const cached = estimateFeeCache.get(cacheKey);

  if (cached) {
    if (cached && Date.now() - cached.createdAt < cacheExpires) {
      deferred = cached.deferred;
    } else {
      // cache is expired
      estimateFeeCache.delete(cacheKey);
    }
  }

  if (!deferred) {
    deferred = $.Deferred();

    estimateFeeCache.set(cacheKey, {
      deferred,
      createdAt: Date.now(),
    });
  }

  $.get(app.getServerUrl(`wallet/estimatefee/?feeLevel=${feeLevel}&amount=${amount}`))
    .done((...args) => deferred.resolve(integerToDecimal(args[0], true), ...args.slice(1)))
    .fail((xhr, ...args) => {
      deferred.reject(xhr, ...args);

      const knownReasons = ['ERROR_INSUFFICIENT_FUNDS', 'ERROR_DUST_AMOUNT'];

      // don't cache calls that failed with an unknown reason
      if (xhr.response && knownReasons.indexOf(xhr.response.reason) === -1) {
        estimateFeeCache.delete(cacheKey);
      }
    });

  return deferred.promise();
}
