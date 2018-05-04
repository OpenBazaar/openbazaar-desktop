import _ from 'underscore';
import app from '../app';
import fiatCurrencies from '../data/currencies';
import {
  getExchangeRates,
  getEvents as getCurrencyEvents,
} from '../utils/currency';

// Since the exchange rate api is dependant on 3rd parties, we can't absolutely rely on
// consistent results, so we'll start with a hard-coded list of crypto-listing currencies.
// The base list could be updated from release to release. If there are additional crypto
// currencies being returned by the exchange rate api, they will be merged into a combined
// list the UI will use.
const baseCurrencies = [
  'BTC',
  'ADA',
  'ARK',
  'BCH',
  'BCN',
  'BTCD',
  'BTG',
  'BTS',
  'DASH',
  'DCR',
  'DGB',
  'DOGE',
  'ETC',
  'ETH',
  'FCT',
  'HSR',
  'IOTA',
  'KMD',
  'LSK',
  'LTC',
  'MONA',
  'NANO',
  'NEBL',
  'NEO',
  'NXS',
  'NXT',
  'PIVX',
  'QTUM',
  'RDD',
  'SC',
  'STEEM',
  'STRAT',
  'SYS',
  'VEN',
  'WAVES',
  'XDN',
  'XEM',
  'XLM',
  'XMR',
  'XRP',
  'XVC',
  'XVG',
  'ZCL',
  'ZEC',
];


// Certain currencies are not in our fiat list, but they're also not crypto currencies.
// They mainly conisist of obscure fiat currencies or precious metals.
const excludes = [
  'BYN',
  'CLF',
  'CNH',
  'CUC',
  'GGP',
  'JEP',
  'IMP',
  'XAG',
  'XAU',
  'XDR',
  'XPD',
  'XPT',
];

let fiatCurrencyCodes;
let currencies;
let exchangeRateCurs = [];
let currenciesNeedRefresh = true;
let exchangeRateChangeBound = false;

export function getCurrencies() {
  if (!exchangeRateChangeBound) {
    getCurrencyEvents().on('exchange-rate-change',
      () => {
        if (
          !currenciesNeedRefresh &&
          !_.isEqual(
            Object.keys(getExchangeRates()).sort(),
            exchangeRateCurs
          )
        ) {
          currenciesNeedRefresh = true;
        }
      });
    exchangeRateChangeBound = true;
  }

  if (currencies && !currenciesNeedRefresh) return currencies;

  if (!fiatCurrencyCodes) {
    fiatCurrencyCodes = fiatCurrencies.map(cur => cur.code);
  }

  const curs = new Set();
  baseCurrencies.forEach(cur => curs.add(cur));
  const _exchangeRateCurs = Object.keys(getExchangeRates());
  exchangeRateCurs = _exchangeRateCurs.sort();
  _exchangeRateCurs
    .forEach(cur => {
      // If it's not a fiat currency code (base on our hard-code list),
      // or on our exclude list, we'll assume it's a crypto currency.
      if (!fiatCurrencyCodes.includes(cur) && !excludes.includes(cur)) {
        curs.add(cur);
      }
    });

  // We'll merge in any previous currencies we had, so the UI lists don't potentially have
  // currencies that are there at one point and then gone later. If the exchange rate for
  // a particular currency is no longer available, the UI will reflect that.
  if (currencies) {
    currencies.forEach(cur => curs.add(cur));
  }

  currenciesNeedRefresh = false;
  currencies = Array.from(curs);
  return currencies;
}

let currenciesSortedByCode;

export function getCurrenciesSortedByCode() {
  if (currenciesSortedByCode && !currenciesNeedRefresh) {
    return currenciesSortedByCode;
  }

  currenciesSortedByCode = getCurrencies().sort();

  return currenciesSortedByCode;
}

let currenciesSortedByName;
const defaultLang = app && app.localSettings &&
  app.localSettings.standardizedTranslatedLang() || 'en-US';

export function getCurrenciesSortedByName(lang = defaultLang) {
  if (currenciesSortedByName && !currenciesNeedRefresh) {
    return currenciesSortedByName;
  }

  currenciesSortedByName = getCurrencies().sort((a, b) => {
    const aTranslationKey = `cryptoCurrencies.${a}`;
    const bTranslationKey = `cryptoCurrencies.${b}`;
    const aName = app.polyglot.t(aTranslationKey) === aTranslationKey ?
      a : app.polyglot.t(aTranslationKey);
    const bName = app.polyglot.t(bTranslationKey) === bTranslationKey ?
      b : app.polyglot.t(bTranslationKey);
    return aName.localeCompare(bName, lang);
  });

  return currenciesSortedByName;
}

export const defaultQuantityBaseUnit = 100000000;
