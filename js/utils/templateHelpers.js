import $ from 'jquery';
import app from '../app';
import { isFiatCur } from '../data/currencies';
import {
  formatCurrency,
  convertAndFormatCurrency,
  convertCurrency,
  formatPrice,
  getCurrencyValidity,
  getExchangeRate,
  renderFormattedCurrency,
  renderPairedCurrency,
} from './currency';
import {
  getCurrencyByCode as getWalletCurByCode,
  supportedWalletCurs,
  anySupportedByWallet,
  ensureMainnetCode,
} from '../data/walletCurrencies';
import {
  renderCryptoIcon,
  renderCryptoTradingPair,
  renderCryptoPrice,
} from '../utils/crypto';
import {
  isHiRez, isLargeWidth, isSmallHeight, getAvatarBgImage, getListingBgImage,
} from './responsive';
import { upToFixed, localizeNumber } from './number';
import twemoji from 'twemoji';
import { splitIntoRows, abbrNum } from './';
import { tagsDelimiter } from '../utils/lib/selectize';
import is from 'is_js';

/**
 * This higher-order function will augment the given function so that rather than
 * bombing on an exception, it will log the error to the console and return a fallback
 * return value (defaults to an empty string). This is useful for templates where you'd
 * rather the whole template doesn't bomb on bad data (for example because some 3rd party
 * data is missing) and instead some fallback text is displayed.
 */
function gracefulException(func, fallbackReturnVal = '') {
  if (typeof func !== 'function') {
    throw new Error('Please provided a function.');
  }

  return ((...args) => {
    let retVal = fallbackReturnVal;

    try {
      retVal = func(...args);
    } catch (e) {
      console.error(e);
    }

    return retVal;
  });
}

export function polyT(key, options) {
  return app.polyglot.t(key, options);
}

export function parseEmojis(text, className = '', attrs = {}) {
  const parsed = twemoji.parse(text,
    icon => (`../imgs/emojis/72X72/${icon}.png`));
  const $parsed = $(`<div>${parsed}</div>`);

  $parsed.find('img')
    .each((index, img) => {
      const $img = $(img);
      $img.addClass(`emoji ${className}`);

      Object.keys(attrs)
        .forEach(attr => {
          $img.attr(attr, attrs[attr]);
        });
    });

  return $parsed.html();
}

/**
 * If the average is a number, show the last 2 digits and trim any trailing zeroes.
 * @param {number} average - the average rating
 * @param {number} count - the number of ratings
 * @param {boolean) skipCount - a count wasn't sent, don't show it or test it for validity
 */
export function formatRating(average, count, skipCount) {
  const avIsNum = typeof average === 'number';
  const countIsNum = typeof count === 'number';
  const ratingAverage = avIsNum ? average.toFixed(1) : '?';
  let ratingCount = countIsNum ? ` (${abbrNum(count)})` : ' (?)';
  if (skipCount) ratingCount = '';
  const error = !avIsNum || (!countIsNum && !skipCount) ?
    ' <i class="ion-alert-circled clrTErr"></i>' : '';
  return `${parseEmojis('⭐')}&nbsp;${ratingAverage}${ratingCount}${error}`;
}

export const getServerUrl = app.getServerUrl.bind(app);

const currencyExport = {
  formatPrice,
  formatCurrency,
  convertAndFormatCurrency,
  convertCurrency,
  getCurrencyValidity,
  getExchangeRate,
  formattedCurrency: gracefulException(renderFormattedCurrency),
  pairedCurrency: gracefulException(renderPairedCurrency),
  isFiatCur,
};

const crypto = {
  cryptoIcon: gracefulException(renderCryptoIcon),
  tradingPair: gracefulException(renderCryptoTradingPair),
  cryptoPrice: gracefulException(renderCryptoPrice),
  ensureMainnetCode,
  supportedWalletCurs,
  anySupportedByWallet,
  getWalletCurByCode,
};

export {
  currencyExport as currencyMod,
  crypto,
  isHiRez,
  isLargeWidth,
  isSmallHeight,
  getAvatarBgImage,
  getListingBgImage,
  localizeNumber,
  upToFixed,
  splitIntoRows,
  is,
  tagsDelimiter,
};
