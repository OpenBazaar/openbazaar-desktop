import $ from 'jquery';
import app from '../app';
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
  getServerCurrency,
  getBlockChainTxUrl,
  getBlockChainAddressUrl,
  getCurrencyByCode as getCryptoCurByCode,
} from '../data/cryptoCurrencies';
import {
  renderCryptoIcon,
  renderCryptoTradingPair,
  renderCryptoPrice,
} from '../utils/crypto';
import {
  isHiRez, isLargeWidth, isSmallHeight, getAvatarBgImage, getListingBgImage,
} from './responsive';
import { upToFixed } from './number';
import twemoji from 'twemoji';
import { splitIntoRows, abbrNum } from './';
import { tagsDelimiter } from '../utils/lib/selectize';
import is from 'is_js';

export function polyT(key, options) {
  return app.polyglot.t(key, options);
}

/**
 * At times you may be making a translation based off user / server data and
 * a translation may not be available. Polyglot handlees that by just returning the
 * key. For example, app.polyglot.t('howdy') would return 'howdy' if the key was not
 * present in the translation file. This function will allow you to return a different
 * string in that case, e.g. app.polyglot.t('howdy', 'no soup for you') would return
 * 'no soup for you' if the 'howdy' key is not presetn.
 */
// TODO
// TODO
// Apply this to places this functionality was manually done prior to this function creation!
export function polyTFallback(key, fallback, options) {
  const translated = polyT(key, options);

  if (translated === key) {
    // no translation is present for the given key
    return fallback;
  }

  return translated;
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
  return `${parseEmojis('⭐')} ${ratingAverage}${ratingCount}${error}`;
}

export const getServerUrl = app.getServerUrl.bind(app);

const currencyExport = {
  formatPrice,
  formatCurrency,
  convertAndFormatCurrency,
  convertCurrency,
  getCurrencyValidity,
  getServerCurrency,
  getCryptoCurByCode,
  getExchangeRate,
  formattedCurrency: renderFormattedCurrency,
  pairedCurrency: renderPairedCurrency,
  getBlockChainTxUrl,
  getBlockChainAddressUrl,
};

const crypto = {
  cryptoIcon: renderCryptoIcon,
  tradingPair: renderCryptoTradingPair,
  cryptoPrice: renderCryptoPrice,
};

export {
  currencyExport as currencyMod,
  crypto,
  isHiRez,
  isLargeWidth,
  isSmallHeight,
  getAvatarBgImage,
  getListingBgImage,
  upToFixed,
  splitIntoRows,
  is,
  tagsDelimiter,
};
