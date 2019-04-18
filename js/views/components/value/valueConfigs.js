// doc me up joe
// doc me up joe
// doc me up joe
// doc me up joe

// todo: maybe call this Value configs and move out of here....?

import {
  getCurMeta,
  getExchangeRates,
} from '../../../utils/currency';
import { setCurs } from './Value';

// todo: be consistent with the "full" format below
// todo: be consistent with the "full" format below
// todo: be consistent with the "full" format below
// todo: be consistent with the "full" format below
// todo: be consistent with the "full" format below
export function short(fromCur, toCur, options = {}) {
  // validate args
  // toCur optional, put in options

  const currency =
    toCur &&
    getExchangeRates(fromCur) &&
    getExchangeRates(toCur) ?
      toCur : fromCur;

  const { isFiat } = getCurMeta(currency);

  return {
    truncateAfterChars: 10,
    tooltipOnTruncatedZero: true,
    minDisplayDecimals: isFiat ? 2 : 0,
    maxDisplayDecimals: isFiat ? 2 : 4,
    maxDisplayDecimalsOnZero: 6,
    ...options,
  };
}

// doc me up - actually "almost" full
export function full(options = {}) {
  const opts = setCurs(options);
  let currency = opts.fromCur;

  if (
    opts.fromCur !== opts.toCur &&
    getExchangeRates(opts.fromCur) &&
    getExchangeRates(opts.toCur)
  ) {
    currency = opts.toCur;
  }

  const { isFiat } = getCurMeta(currency);

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
