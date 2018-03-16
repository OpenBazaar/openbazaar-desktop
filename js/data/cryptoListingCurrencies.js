// import _ from 'underscore';
import app from '../app';
// import bitcoreLib from 'bitcore-lib';
// import bech32 from 'bech32';

// If a currency does not support fee bumping or you want to disable it, do not provide a
// feeBumpTransactionSize setting.

const currencies = [
  'BTC',
  'BCH',
  'BAT',
  'ZRX',
  'ZEC',
];

export default currencies;

let currenciesSortedByCode;

export function getCurrenciesSortedByCode() {
  if (currenciesSortedByCode) {
    return currenciesSortedByCode;
  }

  currenciesSortedByCode = currencies.sort((a, b) => {
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  });

  return currenciesSortedByCode;
}

let currenciesSortedByName;

export function getCurrenciesSortedByName() {
  if (currenciesSortedByName) {
    return currenciesSortedByName;
  }

  currenciesSortedByName = currencies.sort((a, b) => {
    const aName = app.polyglot.t(`cryptoCurrencies.${a.code}`) || a.code;
    const bName = app.polyglot.t(`cryptoCurrencies.${b.code}`) || b.code;
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  });

  return currenciesSortedByName;
}
