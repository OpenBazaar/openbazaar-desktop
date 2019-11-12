import _ from 'underscore';
import app from '../app';
import bitcoreLib from 'bitcore-lib';
import bech32 from 'bech32';

// If a currency does not support fee bumping or you want to disable it, do not provide a
// feeBumpTransactionSize setting.

let _currencies = [
  {
    code: 'BTC',
    testnetCode: 'TBTC',
    symbol: '₿',
    // Not allowing fee bump on BTC right now given the fees.
    // feeBumpTransactionSize: 154,
    qrCodeText: address => `bitcoin:${address}`,
    icon: 'imgs/cryptoIcons/BTC.png',
    url: 'https://bitcoin.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://chain.so/address/BTCTEST/${address}` :
        `https://blockchair.com/bitcoin/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://chain.so/tx/BTCTEST/${txid}` :
        `https://blockchair.com/bitcoin/transaction/${txid}`
    ),
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
    supportsEscrowTimeout: true,
    blockTime: 1000 * 60 * 10,
    externallyFundableOrders: true,
  },
  {
    code: 'BCH',
    testnetCode: 'TBCH',
    feeBumpTransactionSize: 154,
    qrCodeText: address => {
      let prefixedAddress = address;

      const prefix = app.serverConfig.testnet ? 'bchtest' : 'bitcoincash';
      prefixedAddress = address.startsWith(prefix) ?
        prefixedAddress : `${prefix}:${address}`;

      return prefixedAddress;
    },
    icon: 'imgs/cryptoIcons/BCH.png',
    url: 'https://bitcoincash.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://explorer.bitcoin.com/tbch/address/bchtest:${address}` :
        `https://blockchair.com/bitcoin-cash/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://explorer.bitcoin.com/tbch/tx/${txid}` :
        `https://blockchair.com/bitcoin-cash/transaction/${txid}`
    ),
    supportsEscrowTimeout: true,
    blockTime: 1000 * 60 * 10,
    externallyFundableOrders: true,
  },
  {
    code: 'ETH',
    testnetCode: 'TETH',
    qrCodeText: address => `ethereum:${address}`,
    icon: 'imgs/cryptoIcons/ETH.png',
    url: 'https://ethereum.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://rinkeby.etherscan.io/address/${address}` :
        `https://blockchair.com/ethereum/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://rinkeby.etherscan.io/tx/${txid}` :
        `https://blockchair.com/ethereum/transaction/${txid}`
    ),
    supportsEscrowTimeout: true,
    blockTime: 1000 * 10,
    externallyFundableOrders: false,
  },
  {
    code: 'LTC',
    testnetCode: 'TLTC',
    feeBumpTransactionSize: 154,
    qrCodeText: address => `litecoin:${address}`,
    icon: 'imgs/cryptoIcons/LTC.png',
    url: 'https://litecoin.org/',
    getBlockChainAddressUrl: (address, isTestnet) => (
      isTestnet ?
        `https://chain.so/address/LTCTEST/${address}` :
        `https://blockchair.com/litecoin/address/${address}`
    ),
    getBlockChainTxUrl: (txid, isTestnet) => (
      isTestnet ?
        `https://chain.so/tx/LTCTEST/${txid}` :
        `https://blockchair.com/litecoin/transaction/${txid}`
    ),
    supportsEscrowTimeout: true,
    blockTime: 1000 * 60 * 2.5,
    externallyFundableOrders: true,
  },
  {
    code: 'ZEC',
    testnetCode: 'TZEC',
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
    supportsEscrowTimeout: false,
    blockTime: 1000 * 60 * 2.5,
    externallyFundableOrders: true,
  },
];

let _initialized = false;

function enforceInitialized() {
  if (!_initialized) {
    throw new Error('This module must be initialized before proceeeding.');
  }
}

let _indexedCurrencies;

function getIndexedCurrencies() {
  if (_indexedCurrencies) return _indexedCurrencies;

  _indexedCurrencies = _currencies
    .reduce((indexedObj, currency) => {
      indexedObj[currency.code] = indexedObj[currency.testnetCode] = { ...currency };
      return indexedObj;
    }, {});

  return _indexedCurrencies;
}

export function init(walletCurs, walletCurDef) {
  if (!Array.isArray(walletCurs)) {
    // the wallet curs as provided in the 'wallets' property of 'ob/config'
    throw new Error('Please provide a list of wallet currencies.');
  }

  if (typeof walletCurDef !== 'object') {
    // the wallet cur definition as provided in 'ob/wallet/currencies'
    throw new Error('Please provide the wallet currencies definition as an object.');
  }

  // The final currencies list stored in this module will be a union of
  // the walletCurs, the walletCur def and the initial currencies declared
  // here in the _currencies variable. The currency must be declared in all
  // three for it to remain.
  const curs = [];

  const indexedCurs = getIndexedCurrencies();
  // We don't want the indexed curs cached since the definition is about to change
  _indexedCurrencies = null;

  Object
    .keys(indexedCurs)
    .forEach(curCode => {
      const curDef = walletCurDef[curCode];

      if (
        curDef &&
        walletCurs.includes(curDef.code)
      ) {
        const clientCur = indexedCurs[curDef.code];
        const curData = {
          ...clientCur,
          coinDivisibility: curDef.divisibility,
        };

        curs.push(curData);
      }
    });

  _currencies = curs;
  _initialized = true;
}

function getTranslatedCurrencies(
  lang = app && app.localSettings &&
    app.localSettings.standardizedTranslatedLang() || 'en-US',
  sort = true
) {
  enforceInitialized();

  if (!lang) {
    throw new Error('Please provide the language the translated currencies' +
      ' should be returned in.');
  }

  let translated = _currencies.map((currency) => ({
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

export function getCurrencyByCode(code) {
  enforceInitialized();

  if (typeof code !== 'string') {
    throw new Error('Please provide a currency code as a string.');
  }

  return getIndexedCurrencies()[code];
}

let currenciesSortedByCode;

export function getCurrenciesSortedByCode() {
  enforceInitialized();

  if (currenciesSortedByCode) {
    return currenciesSortedByCode;
  }

  currenciesSortedByCode = _currencies.sort((a, b) => {
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  });

  return currenciesSortedByCode;
}

/**
 * Since many of our crypto related mapping (e.g. icons) are done based off of
 * a mainnet code, this function will attempt to obtain the mainnet code if a testnet
 * one is passed in. This only works for crypto coins that we have registered as
 * accepted currencies (i.e. are enumerated in data/cryptoCurrencies), but those are
 * the only ones that should ever come as testnet codes.
 */
export function ensureMainnetCode(cur) {
  enforceInitialized();

  if (typeof cur !== 'string' || !cur.length) {
    throw new Error('Please provide a non-empty string.');
  }

  const curObj = getCurrencyByCode(cur);
  return curObj ? curObj.code : cur;
}

export function getWalletCurs() {
  return _currencies;
}

/**
 * Returns a list of the wallet currency codes supported by the wallet.
 *
 * @param {object} [options={}] - Function options
 * @param {boolean} [options.testnet=apps.serverConfig.testnet] - Indicates if the app
 *   is running on testnet. If so, testnet codes will be returned.
 * @return {Array} An Array containing the currency codes that are supported by the wallet.
 */
export function supportedWalletCurs(options = {}) {
  const opts = {
    testnet: app && app.serverConfig && app.serverConfig.testnet || false,
    ...options,
  };

  enforceInitialized();

  return getWalletCurs()
    .filter(cur => (opts.testnet ? cur.testnetCode : true))
    .map(cur => (opts.testnet ? cur.testnetCode : cur.code));
}

/**
 * Returns a boolean indicating whether the given code is supported by the wallet.
 *
 * @param {string} cur - A currency code.
 * @param {object} [options={}] - Function options - these are sent to supportedWalletCurs.
 * @return {boolean} A boolean indicating whether the given code is supported by the wallet.
 */
export function isSupportedWalletCur(cur, options = {}) {
  enforceInitialized();

  if (typeof cur !== 'string') {
    throw new Error('Please provide a cur as a string.');
  }

  return supportedWalletCurs(options).includes(cur);
}

/**
 * Given a list of currencies, a filtered list will be returned containing only the
 * currencies in the list that are supported by the wallet
 *
 * @param {Array} curs - A list of currencies to filter.
 * @param {object} [options={}] - Function options - these are sent to isSupportedWalletCur.
 * @return {Array} A list based off the intersection of the giveen curs and the supported
 *   wallt curs.
 */
export function onlySupportedWalletCurs(curs = [], options = {}) {
  enforceInitialized();

  if (!Array.isArray(curs)) {
    throw new Error('Curs must be provided as an Array.');
  }

  if (curs.filter(cur => (typeof cur !== 'string')).length) {
    throw new Error('Curs items must be provided as strings.');
  }

  return curs.filter(cur => isSupportedWalletCur(cur, options));
}

/**
 * A proxy for onlySupportedWalletCurs with the difference being that this will
 * return a boolean indicating if any of the provided curs are supported as wallet
 * currencies. (same arguments as onlySupportedWalletCurs).
 * @return {boolean} A boolean indicating if any of the provided curs are supported
 *   as wallet currencies.
 */
export function anySupportedByWallet(...args) {
  enforceInitialized();
  return !!(onlySupportedWalletCurs(...args).length);
}
