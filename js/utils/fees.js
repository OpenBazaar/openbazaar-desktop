import $ from 'jquery';
import app from '../app';

export const feeLevels = [
  'PRIORITY',
  'NORMAL',
  'ECONOMIC',
];

const cacheExpires = 1000 * 60; // mirroring the server here
const estimateFeeCache = new Map();

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
      estimateFeeCache.set(feeLevel, {
        deferred,
        createdAt: Date.now(),
      });
    }
  }

  $.get(app.getServerUrl(`wallet/estimatefee/?feeLevel=${feeLevel}`))
    .done(...args => deferred.resolve(...args))
    .fail(...args => deferred.reject(...args));

  return deferred.promise();
}
