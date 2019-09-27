import $ from 'jquery';
import {
  integerToDecimal,
  decimalToInteger,
  isValidCoinDivisibility,
  getCoinDivisibility,
} from './currency';
import { validateNumberType } from './number';
import { getSocket, events as serverConnectEvents } from './serverConnect';
import app from '../app';

export const feeLevels = [
  'PRIORITY',
  'NORMAL',
  'ECONOMIC',
];

const cacheExpires = 1000 * 60 * 5;
const estimateFeeCache = {};
let watchingTransactions = false;

function onSocket(e) {
  if (e.jsonData.wallet && !e.jsonData.wallet.height) {
    if (estimateFeeCache[e.jsonData.wallet.wallet]) {
      estimateFeeCache[e.jsonData.wallet.wallet].clear();
    }
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
 * @param {number|string|BigNumber} amount - The amount of the transaction in the servers currency -
 *   not in base units. (e.g. for BTC, provide a BTC amount, not Satoshi)
 * @param {object} options
 * @param {boolean} [options.divisibility] - You can provide the divisibility, otherwise
 *   it will be obtained from the wallet currency definition.
 * @return {object} An jQuery promise which on success will resolve with the fee
 *   (not in base units). If the call fails, the deferred will fail and pass on the
 *   error reason as the first arg and the xhr as the second.
 */
export function estimateFee(coinType, feeLevel, amount, options = {}) {
  if (feeLevels.indexOf(feeLevel) === -1) {
    throw new Error(`feelevel must be one of ${feeLevels.join(', ')}`);
  }

  validateNumberType(amount);

  if (typeof coinType !== 'string' || !coinType) {
    throw new Error('Please provide the coinType as a string.');
  }

  const divisibility = options.divisibility || getCoinDivisibility(coinType);
  const [isValidDivis, divisErr] = isValidCoinDivisibility(divisibility);

  if (!isValidDivis) {
    throw new Error(divisErr);
  }

  let amountInBaseUnits;

  try {
    amountInBaseUnits = decimalToInteger(amount, divisibility, {});
  } catch (e) {
    throw new Error(`Unable to convert the amount to base units: ${e}`);
  }

  watchTransactions();

  let deferred;
  const cacheKey = `${feeLevel}-${amount}`;
  const cached = estimateFeeCache[coinType] && estimateFeeCache[coinType].get(cacheKey);

  if (cached) {
    if (cached && Date.now() - cached.createdAt < cacheExpires) {
      deferred = cached.deferred;
    } else {
      // cache is expired
      estimateFeeCache[coinType].delete(cacheKey);
    }
  }

  if (!deferred) {
    deferred = $.Deferred();

    estimateFeeCache[coinType] = estimateFeeCache[coinType] || new Map();
    estimateFeeCache[coinType].set(cacheKey, {
      deferred,
      createdAt: Date.now(),
    });

    const queryArgs =
      `feeLevel=${feeLevel}&amount=${amountInBaseUnits}`;
    const estimateFeeXhr =
      $.get(app.getServerUrl(`wallet/estimatefee/${coinType}?${queryArgs}`))
        .done((...args) => {
          let convertedAmount;

          try {
            convertedAmount = integerToDecimal(
              args[0].amount,
              args[0].currency.divisibility,
              { returnUndefinedOnError: false }
            );
          } catch (e) {
            deferred.reject(
              `Unable to convert the estimated fee amount to base units: ${e.message}`,
              estimateFeeXhr
            );
            return;
          }

          deferred.resolve(
            convertedAmount,
            ...args.slice(1)
          );
        }).fail(xhr => {
          const reason = xhr && xhr.responseJSON && xhr.responseJSON.reason || '';
          deferred.reject(reason, xhr);

          const knownReasons = ['ERROR_INSUFFICIENT_FUNDS', 'ERROR_DUST_AMOUNT'];

          // don't cache calls that failed with an unknown reason
          if (
            !knownReasons.includes(reason) &&
            estimateFeeCache[coinType]
          ) {
            estimateFeeCache[coinType].delete(cacheKey);
          }
        });
  }

  return deferred.promise();
}

const getFeesCache = {};

/**
 * Will call the fees api ('wallet/fees') on the server.
 *
 * @return {object} An jQuery promise which on success will resolve with the fees
 *   per byte in Satoshi for each fee level. If the call fails, the deferred will
 *   fail and pass on the args the xhr fail handler receives.
 */
export function getFees(coinType) {
  if (typeof coinType !== 'string' || !coinType) {
    throw new Error('Please provide the coinType as a string.');
  }

  let deferred;

  if (getFeesCache && getFeesCache[coinType] && getFeesCache[coinType].deferred &&
    Date.now() - getFeesCache[coinType].createdAt < cacheExpires) {
    deferred = getFeesCache[coinType].deferred;
  }

  if (!deferred) {
    deferred = $.Deferred();

    getFeesCache[coinType] = {
      deferred,
      createdAt: Date.now(),
    };

    $.get(app.getServerUrl(`wallet/fees/${coinType}`))
      .done(data => {
        let economic;
        let normal;
        let priority;

        try {
          economic = integerToDecimal(
            data.economic.amount,
            data.economic.currency.divisibility
          );
          normal = integerToDecimal(
            data.normal.amount,
            data.normal.currency.divisibility
          );
          priority = integerToDecimal(
            data.priority.amount,
            data.priority.currency.divisibility
          );
        } catch (e) {
          deferred.reject(`There was an error processing the reponse: ${e.message}`);
          return;
        }

        deferred.resolve({
          economic,
          normal,
          priority,
        });
      })
      .fail(xhr => {
        const reason =
          xhr && xhr.responseJSON && xhr.responseJSON.reason || '';
        deferred.reject(reason);
        delete getFeesCache[coinType];
      });
  }

  return deferred.promise();
}
