// doc me up joe
// doc me up joe
// doc me up joe
// doc me up joe

import {
  getCurMeta,
  getExchangeRates,
} from '../../../utils/currency';
import { setCurs } from './Value';

/*
 * Given an options object containing a toCur and fromCur,
 * this function will return the currency that would utimately
 * be used to display a price. If exchange rate data is available
 * for both currencies, then the toCur would be returned, otherwise
 * the fromCur.
 */
function getCurrency(options = {}) {
  if (typeof options !== 'object') {
    throw new Error('The option must be provided as an object.');
  }

  const opts = setCurs(options);

  if (
    opts.fromCur !== opts.toCur &&
    getExchangeRates(opts.fromCur) &&
    getExchangeRates(opts.toCur)
  ) {
    return opts.toCur;
  }

  return opts.fromCur;
}

export function short(options = {}) {
  const { isFiat } = getCurMeta(getCurrency(options));

  return {
    truncateAfterChars: 12,
    tooltipOnTruncatedZero: true,
    minDisplayDecimals: isFiat ? 2 : 0,
    maxDisplayDecimals: isFiat ? 2 : 4,
    maxDisplayDecimalsOnZero: 6,
    ...options,
  };
}

// doc me up - actually "almost" full
export function full(options = {}) {
  // multiple is fiats out there?
  // multiple is fiats out there?
  // multiple is fiats out there?
  // multiple is fiats out there?
  // multiple is fiats out there?
  // multiple is fiats out there?
  // multiple is fiats out there?
  const { isFiat } = getCurMeta(getCurrency(options));

  return {
    truncateAfterChars: 25,
    tooltipOnTruncatedZero: true,
    minDisplayDecimals: isFiat ? 2 : 0,
    // should become base units for crypto
    // should become base units for crypto
    // should become base units for crypto
    maxDisplayDecimals: isFiat ? 2 : 8,
    // should become base units for crypto, 6 for fiat
    // should become base units for crypto, 6 for fiat
    // should become base units for crypto, 6 for fiat
    maxDisplayDecimalsOnZero: 8,
    ...options,
  };
}
