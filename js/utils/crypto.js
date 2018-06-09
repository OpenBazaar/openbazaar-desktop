import loadTemplate from './loadTemplate';
import {
  getServerCurrency,
  getCurrencyByCode,
} from '../data/cryptoCurrencies';

/**
 * Since many of our crypto related mapping (e.g. icons) are done based off of
 * a mainnet code, this function will attempt to obtain the mainnet code if a testnet
 * one is passed in. This only works for crypto coins that we have registered as
 * accepted currencies (i.e. are enumerated in data/cryptoCurrencies), but those are
 * the only ones that should ever come as testnet codes.
 */
export function ensureMainnetCode(cur) {
  if (typeof cur !== 'string' || !cur.length) {
    throw new Error('Please provide a non-empty string.');
  }

  const curObj = getCurrencyByCode(cur);
  return curObj ? curObj.code : cur;
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
  } else {
    code = ensureMainnetCode(code);
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

export function renderCryptoTradingPair(options = {}) {
  if (typeof options.fromCur !== 'string') {
    throw new Error('Please provide a fromCur as a string.');
  }

  if (typeof options.toCur !== 'string') {
    throw new Error('Please provide a toCur as a string.');
  }

  const opts = {
    className: 'cryptoTradingPairLg',
    arrowIconClass: '',
    ...options,
    fromCur: ensureMainnetCode(options.fromCur.toUpperCase()),
    toCur: ensureMainnetCode(options.toCur.toUpperCase()),
  };

  let rendered = '';

  loadTemplate('components/cryptoTradingPair.html', t => {
    rendered = t(opts);
  });

  return rendered;
}
