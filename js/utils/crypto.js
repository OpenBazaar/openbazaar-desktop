import loadTemplate from './loadTemplate';
import { getServerCurrency } from '../data/cryptoCurrencies';

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

export function renderCryptoTradingPair(options = {}) {
  if (typeof options.fromCur !== 'string') {
    throw new Error('Please provide a fromCur as a string.');
  }

  if (typeof options.toCur !== 'string') {
    throw new Error('Please provide a fromCur as a string.');
  }

  const opts = {
    className: 'cryptoTradingPairLg',
    arrowIconClass: '',
    ...options,
    fromCur: options.fromCur.toUpperCase(),
    toCur: options.toCur.toUpperCase(),
  };

  let rendered = '';

  loadTemplate('components/cryptoTradingPair.html', t => {
    rendered = t(opts);
  });

  return rendered;
}
