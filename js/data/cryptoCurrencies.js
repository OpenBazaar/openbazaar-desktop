import _ from 'underscore';
import app from '../app';
import bitcoreLib from 'bitcore-lib';
import bech32 from 'bech32';

// If a currency does not support fee bumping or you want to disable it, do not provide a
// feeBumpTransactionSize setting.

const currencies = [
  {
    code: 'BTC',
    testnetCode: 'TBTC',
    symbol: '₿',
    baseUnit: 100000000,
    minDisplayDecimals: 0,
    maxDisplayDecimals: 8,
    averageModeratedTransactionSize: 184,
    // Not allowing fee bump on BTC right now given the fees.
    // feeBumpTransactionSize: 154,
    qrCodeText: address => `bitcoin:${address}`,
    icon: 'imgs/cryptoIcons/btcIcon128.png',
    url: 'https://bitcoin.org/',
    needCoinLink: 'https://openbazaar.org/bitcoin',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBTC/address/${address}` :
        `https://blockchain.info/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBTC/tx/${txid}` :
        `https://blockchain.info/tx/${txid}`
    ),
    canShapeShiftInto: true,
    isValidAddress: address => {
      if (typeof address !== 'string') {
        throw new Error('Please provide a string.');
      }

      try {
        bitcoreLib.encoding.Base58Check.decode(address);
        return true;
      } catch (exc) {
        try {
          bech32.decode(address);
          return true;
        } catch (exc2) {
          return false;
        }
      }
    },
  },
  {
    code: 'BCH',
    testnetCode: 'TBCH',
    baseUnit: 100000000,
    minDisplayDecimals: 0,
    maxDisplayDecimals: 8,
    averageModeratedTransactionSize: 184,
    feeBumpTransactionSize: 154,
    qrCodeText: address => address,
    icon: 'imgs/cryptoIcons/bchIcon128.png',
    url: 'https://bitcoincash.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBCC/address/${address}` :
        `https://blockdozer.com/insight/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBCC/tx/${txid}` :
        `https://blockdozer.com/insight/tx/${txid}`
    ),
    canShapeShiftInto: true,
  },
  {
    code: 'ZEC',
    testnetCode: 'TZEC',
    baseUnit: 100000000,
    minDisplayDecimals: 0,
    maxDisplayDecimals: 8,
    averageModeratedTransactionSize: 184,
    feeBumpTransactionSize: 154,
    qrCodeText: address => `zcash:${address}`,
    icon: 'imgs/cryptoIcons/zecIcon128.png',
    url: 'https://z.cash',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://explorer.testnet.z.cash/address/${address}` :
        `https://explorer.zcha.in/accounts/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://explorer.testnet.z.cash/tx/${txid}` :
        `https://explorer.zcha.in/transactions/${txid}`
    ),
    canShapeShiftInto: true,
  },
];

export default currencies;

const defaultLangParam = app && app.localSettings &&
  app.localSettings.standardizedTranslatedLang() || 'en-US';
function getTranslatedCurrencies(lang = defaultLangParam, sort = true) {
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

let _indexedCurrencies;

function getIndexedCurrencies() {
  if (_indexedCurrencies) return _indexedCurrencies;

  _indexedCurrencies = memoizedGetTranslatedCurrencies(undefined, false)
    .reduce((indexedObj, currency) => {
      indexedObj[currency.code] = indexedObj[currency.testnetCode] = { ...currency };
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

/**
 * Returns the currency data object based on the currency the connected server is in.
 */
export function getServerCurrency() {
  if (!app || !app.serverConfig || !app.serverConfig.cryptoCurrency) {
    throw new Error('The cryptoCurrency field must be set on app.serverConfig.');
  }

  let curData = getCurrencyByCode(app.serverConfig.cryptoCurrency);

  curData = {
    ...curData,
    isTestnet: app.serverConfig.cryptoCurrency === curData.testnetCode,
  };

  return curData;
}

/**
 * Will render the icon for the crypto currency provided in options.code. If not provided, it will
 * attempt to use the server currency. If the currency ends up not having an icon, a blank string
 * will be returned.
 */
export function renderCryptoIcon(options = {}) {
  let code = options.code;

  if (!code) {
    const serverCur = getServerCurrency();
    code = serverCur && serverCur.code || '';
  }

  const opts = {
    code,
    className: '',
    attrs: {},
    ...options,
  };

  const curData = getCurrencyByCode(opts.code);

  if (curData && curData.icon) {
    const attrs = Object.keys(opts.attrs).reduce(
      (attrString, key) => `${attrString} ${key}="${opts.attrs[key]}"`, ''
    );

    const style = `style="background-image: url(../${curData.icon})"`;
    return `<i class="cryptoIcon ${opts.className}" ${attrs} ${style}></i>`;
  }

  return '';
}

export function getBlockChainTxUrl(txid, isTestnet) {
  const serverCur = getServerCurrency();

  if (serverCur) {
    return serverCur.getBlockChainTxUrl(txid, isTestnet);
  }

  return '';
}

export function getBlockChainAddressUrl(address, isTestnet) {
  const serverCur = getServerCurrency();

  if (serverCur) {
    return serverCur.getBlockChainAddressUrl(address, isTestnet);
  }

  return '';
}

