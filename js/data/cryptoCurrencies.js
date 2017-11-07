import _ from 'underscore';
import app from '../app';

const currencies = [
  {
    name: 'Bitcoin',
    code: 'BTC',
    testnetCode: 'TBTC',
    symbol: '₿',
    baseUnit: 100000000,
    minDisplayDecimals: 0,
    maxDisplayDecimals: 8,
  },
];

export default currencies;

let _indexedCurrencies;

function getIndexedCurrencies() {
  if (_indexedCurrencies) return _indexedCurrencies;

  _indexedCurrencies = currencies.reduce((indexedObj, currency) => {
    indexedObj[currency.code] = _.omit(currency, 'code');
    indexedObj[currency.testnetCode] = { ...currency };
    return indexedObj;
  }, {});

  return _indexedCurrencies;
}

export function getCurrencyByCode(code) {
  if (!code) {
    throw new Error('Please provide a currency code.');
  }

  return getIndexedCurrencies()[code];
}

function getTranslatedCurrencies(lang = app.localSettings.standardizedTranslatedLang(),
  sort = true) {
  if (!lang) {
    throw new Error('Please provide the language the translated currencies' +
      ' should be returned in.');
  }

  let translated = currencies.map((currency) => ({
    ...currency,
    name: app.polyglot.t(`cryptoCurrencies.${currency.code}`),
  }));

  if (sort) {
    translated = translated.sort((a, b) => a.name.localeCompare(b.name, lang));
  }

  return translated;
}

const memoizedGetTranslatedCurrencies =
  _.memoize(getTranslatedCurrencies, (lang, sort) => `${lang}-${!!sort}`);

export { memoizedGetTranslatedCurrencies as getTranslatedCurrencies };

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

