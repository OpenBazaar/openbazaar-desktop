// doc me up joe
// doc me up joe
// doc me up joe
// doc me up joe

// todo: maybe call this Value configs and move out of here....?

import {
  getCurMeta,
  getExchangeRates,
} from './';

export function short(fromCur, toCur) {
  // validate args
  // toCur optional

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
  };
}
