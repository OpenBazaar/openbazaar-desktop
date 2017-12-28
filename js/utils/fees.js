import $ from 'jquery';
import { integerToDecimal, decimalToInteger } from './currency';
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
  serverConnectEvents.on('connected', e => {
    socket.off(null, onSocket);
    e.socket.on('message', onSocket);
  });
}

/**
 * Will estimate a fee based on the provided amount, fee level and the current state
 * of the wallet.
 *
 * @param {string} feeLevel - The fee level
 * @param {amount} number - The amount of the transaction in the servers currency -
 *   not in base units. (e.g. for BTC, provide a BTC amount, not Satoshi)
 * @return {object} An jQuery promise which on success will resolve with the fee
 *   in Bitcoin. If the call fails, the deferred will fail and pass on the args the
 *   xhr fail handler receives.
 */
export function estimateFee(feeLevel, amount) {
  if (feeLevels.indexOf(feeLevel) === -1) {
    throw new Error(`feelevel must be one of ${feeLevels.join(', ')}`);
  }

  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number.');
  }

  watchTransactions();

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

    const queryArgs =
      `feeLevel=${feeLevel}&amount=${decimalToInteger(amount, app.serverConfig.cryptoCurrency)}`;
    $.get(app.getServerUrl(`wallet/estimatefee/?${queryArgs}`))
      .done((...args) => {
        deferred.resolve(
          integerToDecimal(args[0].estimatedFee, app.serverConfig.cryptoCurrency), ...args.slice(1)
        );
      }).fail((xhr, ...args) => {
        deferred.reject(xhr, ...args);

        const knownReasons = ['ERROR_INSUFFICIENT_FUNDS', 'ERROR_DUST_AMOUNT'];

        // don't cache calls that failed with an unknown reason
        if (xhr.responseJSON && knownReasons.indexOf(xhr.responseJSON.reason) === -1) {
          estimateFeeCache.delete(cacheKey);
        }
      });
  }

  return deferred.promise();
}

let getFeesCache = {};

/**
 * Will call the fees api ('wallet/fees') on the server.
 *
 * @return {object} An jQuery promise which on success will resolve with the fees
 *   per byte in Satoshi for each fee level. If the call fails, the deferred will
 *   fail and pass on the args the xhr fail handler receives.
 */
export function getFees() {
  let deferred;

  if (getFeesCache.deferred && Date.now() - getFeesCache.createdAt < cacheExpires) {
    deferred = getFeesCache.deferred;
  }

  if (!deferred) {
    deferred = $.Deferred();

    getFeesCache = {
      deferred,
      createdAt: Date.now(),
    };

    $.get(app.getServerUrl('wallet/fees'))
      .done((...args) => deferred.resolve(...args))
      .fail((...args) => {
        deferred.reject(...args);
        getFeesCache = {};
      });
  }

  return deferred.promise();
}
