import $ from 'jquery';
import app from '../app';

export const feeLevels = [
  'PRIORITY',
  'NORMAL',
  'ECONOMIC',
];

const cacheExpires = 1000 * 60 * 5;
const estimateFeeCache = new Map();

// We'll approximateally match the server's algorythm to estimate the fee.
// Fee is per byte in satoshi. A estimated average transaction is 200 bytes.
// So we'll multiply the fee by 200 and divide by a 100 mil to get BTC
const feeToBtc = fee => fee * 200 / 100000000;

export default function estimateFee(feeLevel) {
  if (feeLevels.indexOf(feeLevel) === -1) {
    throw new Error(`feelevel must be one of ${feeLevels.join(', ')}`);
  }

  let deferred;
  const cached = estimateFeeCache.get(feeLevel);

  if (cached) {
    if (cached && Date.now() - cached.createdAt < cacheExpires) {
      deferred = cached.deferred;
    } else {
      // cache is expired
      cached.deferred.reject();
    }
  }

  if (!deferred) {
    deferred = $.Deferred();

    estimateFeeCache.set(feeLevel, {
      deferred,
      createdAt: Date.now(),
    });
  }

  window.charlie = $.get(app.getServerUrl(`wallet/estimatefee/?feeLevel=${feeLevel}`))
    .done((...args) => deferred.resolve(feeToBtc(args[0]), ...args.slice(1)))
    .fail((...args) => deferred.reject(...args));

  return deferred.promise();
}
