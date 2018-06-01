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
    icon: 'imgs/cryptoIcons/BTC.png',
    url: 'https://bitcoin.org/',
    needCoinLink: 'https://openbazaar.org/bitcoin',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBTC/address/${address}` :
        `https://blockchair.com/bitcoin/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBTC/tx/${txid}` :
        `https://blockchair.com/bitcoin/transaction/${txid}`
    ),
    canShapeShiftIntoWallet: true,
    canShapeShiftIntoPurchase: false,
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
    icon: 'imgs/cryptoIcons/BCH.png',
    url: 'https://bitcoincash.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBCC/address/${address}` :
        `https://blockdozer.com/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://www.blocktrail.com/tBCC/tx/${txid}` :
        `https://blockdozer.com/tx/${txid}`
    ),
    canShapeShiftIntoWallet: true,
    canShapeShiftIntoPurchase: false,
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
    icon: 'imgs/cryptoIcons/ZEC.png',
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
    canShapeShiftIntoWallet: true,
    canShapeShiftIntoPurchase: false,
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
 * attempt to use the server currency.
 */
export function renderCryptoIcon(options = {}) {
  let code = options.code;
  const baseIconPath = '../imgs/cryptoIcons/';

  if (code !== undefined && typeof code !== 'string' && code !== '') {
    throw new Error('If providing the code, it must be a non-empty string.');
  }

  if (!code) {
    const serverCur = getServerCurrency();
    code = serverCur && serverCur.code || '';
  }

  const opts = {
    code,
    className: '',
    attrs: {},
    defaultIcon: `${baseIconPath}default-coin-icon.png`,
    ...options,
  };

  const attrs = Object.keys(opts.attrs).reduce(
    (attrString, key) => `${attrString} ${key}="${opts.attrs[key]}"`, ''
  );
  const iconUrl = opts.code ?
    `url(${baseIconPath}${opts.code}.png),` :
    '';
  const defaultIcon = opts.defaultIcon ?
    `url(${opts.defaultIcon})` :
    '';
  const style = `style="background-image: ${iconUrl}${defaultIcon}"`;
  return `<i class="cryptoIcon ${opts.className}" ${attrs} ${style}></i>`;
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

