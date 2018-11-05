import $ from 'jquery';
import app from '../app';
import loadTemplate from './loadTemplate';
import { ensureMainnetCode } from '../data/walletCurrencies';

/**
 * Will render the icon for the crypto currency provided in options.code. If not provided, it will
 * attempt to use the server currency.
 */
export function renderCryptoIcon(options = {}) {
  const baseIconPath = '../imgs/cryptoIcons/';

  if (typeof options.code !== 'string' && options.code !== '') {
    throw new Error('Please provide a crypto currency code.');
  }

  const opts = {
    code: ensureMainnetCode(options.code),
    className: '',
    attrs: {},
    defaultIcon: `${baseIconPath}default-coin-icon.png`,
    ...options,
  };

  const attrs = Object.keys(opts.attrs).reduce(
    (attrString, key) => `${attrString} ${key}="${opts.attrs[key]}"`, ''
  );
  const iconUrl = opts.code ?
    `url(${baseIconPath}${opts.code}-icon.png),` :
    '';
  const defaultIcon = opts.defaultIcon ?
    `url(${opts.defaultIcon})` :
    '';
  const style = `style="background-image: ${iconUrl}${defaultIcon}"`;
  return `<i class="cryptoIcon ${opts.className}" ${attrs} ${style}></i>`;
}

/**
 * Will render a a combination of two currenciees indicating that one is being
 * traded for the other (e.g. <btc-icon> BTC > <zec-icon> ZEC). This differs from
 * the CryptoTradingPair view in that the latter allows you to display the exchange
 * rate next to the trading pair. It's also more easily updatable (just setState())
 * in case your currencies need to change dynamically.
 * TODO:
 * TODO:
 * TODO: document the options.
 */
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
    truncateCurAfter: 8,
    ...options,
    fromCur: ensureMainnetCode(options.fromCur.toUpperCase()),
    toCur: ensureMainnetCode(options.toCur.toUpperCase()),
  };

  if (typeof opts.truncateCurAfter === 'number') {
    opts.fromCur = opts.fromCur.length > opts.truncateCurAfter ?
      `${opts.fromCur.slice(0, opts.truncateCurAfter)}…` : opts.fromCur;
    opts.toCur = opts.toCur.length > opts.truncateCurAfter ?
      `${opts.toCur.slice(0, opts.truncateCurAfter)}…` : opts.toCur;
  }

  let rendered = '';

  loadTemplate('components/cryptoTradingPair.html', t => {
    rendered = t(opts);
  });

  return rendered;
}

export function renderCryptoPrice(options = {}) {
  if (typeof options.priceAmount !== 'number') {
    throw new Error('Please provide a price amount as a number.');
  }

  if (typeof options.priceCurrencyCode !== 'string') {
    throw new Error('Please provide a price currency code as a string.');
  }

  if (typeof options.displayCurrency !== 'string') {
    throw new Error('Please provide a display currency code as a string.');
  }

  if (typeof options.priceModifier !== 'number') {
    throw new Error('Please provide a price modifier as a number.');
  }

  const opts = {
    wrappingClass: 'txRgt tx3 txB',
    wrappingTag: 'div',
    marketRelativityClass: 'tx6 txUnb clamp2',
    ...options,
  };

  let rendered = '';

  loadTemplate('components/cryptoPrice.html', t => {
    rendered = t(opts);
  });

  return rendered;
}

let cryptoNamesDeferred;
let nameWorker;

function sendPhrases() {
  if (nameWorker) {
    nameWorker.postMessage({
      type: 'phrases',
      phrases: Object.keys(app.polyglot.phrases)
        .filter(key => key.startsWith('cryptoCurrencies.'))
        .reduce((acc, key) => {
          acc[key] = app.polyglot.phrases[key];
          return acc;
        }, {}),
    });
  }
}

export function getCryptoNames() {
  if (!nameWorker) {
    nameWorker = new Worker('../js/utils/cryptoNamesWorker.js', { type: 'module' });
    sendPhrases();

    app.localSettings.on('change:language', () => nameWorker.sendPhrases());
  }

  cryptoNamesDeferred = cryptoNamesDeferred || $.Deferred();
  return cryptoNamesDeferred.promise();
}
