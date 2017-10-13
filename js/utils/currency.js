import _ from 'underscore';
import app from '../app';
import $ from 'jquery';
import bitcoinConvert from 'bitcoin-convert';
import { upToFixed } from './number';
import { Events } from 'backbone';

const events = {
  ...Events,
};

export { events };

/**
 * Converts the amount from a decimal to an integer. If the
 * currency code is BTC, it will convert to Satoshi.
 */
export function decimalToInteger(amount, isBtc = false) {
  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number.');
  }

  let updatedAmount = amount;

  if (isBtc) {
    updatedAmount = Math.round(amount * 100000000);
  } else {
    updatedAmount = Math.round(amount * 100);
  }

  return updatedAmount;
}

/**
 * Converts the amount from an integer to a decimal, rounding
 * to 2 decimal places. If the currency code is BTC, it will
 * convert from Satoshi to BTC.
 */
export function integerToDecimal(amount, isBtc = false) {
  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number.');
  }

  let updatedAmount = amount;

  if (isBtc) {
    updatedAmount = Number((amount / 100000000).toFixed(8));
  } else {
    updatedAmount = Number((amount / 100).toFixed(2));
  }

  return updatedAmount;
}

/**
 * Will take a number and return a string version of the number
 * with the appropriate number of decimal places based on whether
 * the number represents a BTC or fiat price.
 *
 * This differs from formatCurrency in that this does not localize
 * the number at all. It simply returns the value with the
 * appropriate number of decimal place, e.g:
 *
 * formatPrice(123.456, false) // "123.46"
 * formatPrice(123.456, true)  // "123.45600000"
 *
 * It is more useful for <input>'s because we are not
 * localizing the numbers in them.
 *
 * todo: add this as a template helper; perhaps there's
 * a better name for this function?
 */
export function formatPrice(price, isBtc = false) {
  if (typeof price !== 'number') {
    throw new Error('Please provide a price as a number');
  }

  if (isNaN(price)) {
    throw new Error('Please provide a price that is not NaN');
  }

  let convertedPrice;

  if (isBtc) {
    // Format BTC price so it has up to 8 decimal places,
    // but without any trailing zeros
    convertedPrice = upToFixed(price, 8);
  } else {
    convertedPrice = price.toFixed(2);
  }

  return convertedPrice;
}

/**
 * Will format an amount in the given currency into the format
 * appropriate for the given locale.
 */
// todo: check currency is one of our currencies
export function formatCurrency(amount, currency, options) {
  const opts = {
    locale: app && app.localSettings && app.localSettings.get('language') || 'en-US',
    btcUnit: app && app.localSettings &&
      app.localSettings.get('bitcoinUnit') || 'BTC',
    useBtcSymbol: true, // if true use ฿ for btc instead of BTC
    ...options,
  };

  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number');
  }

  if (isNaN(amount)) {
    throw new Error('Please provide an amount that is not NaN');
  }

  if (typeof opts.locale !== 'string') {
    throw new Error('Please provide a locale as a string');
  }

  if (typeof currency !== 'string') {
    throw new Error('Please provide a currency as a string');
  }

  let formattedCurrency;

  if (currency.toUpperCase() === 'BTC' || currency.toUpperCase() === 'TBTC') {
    let curSymbol;
    let bitcoinConvertUnit;

    switch (opts.btcUnit) {
      case 'MBTC':
        curSymbol = app.polyglot.t('bitcoinCurrencyUnits.MBTC');
        bitcoinConvertUnit = 'mBTC';
        break;
      case 'UBTC':
        curSymbol = app.polyglot.t('bitcoinCurrencyUnits.UBTC');
        bitcoinConvertUnit = 'μBTC';
        break;
      case 'SATOSHI':
        curSymbol = app.polyglot.t('bitcoinCurrencyUnits.SATOSHI');
        bitcoinConvertUnit = 'Satoshi';
        break;
      default:
        // The default is BTC. Using the ฿ char for the Bitcoin symbol which will be
        // replaced by the real Bitcoin symbol once we bring in a Bitcoin font, e.g:
        // http://www.righto.com/2015/02/how-to-display-bitcoin-symbol-using_14.html
        curSymbol = opts.useBtcSymbol ? '฿' : 'BTC';
        bitcoinConvertUnit = 'BTC';
    }

    // going to use USD just to know the localized placement of the $, which we'll swap
    // out with the appropriate Bitcoin symbol
    const formattedAmount = new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(bitcoinConvert(amount, 'BTC', bitcoinConvertUnit));

    let btcUnit = opts.btcUnit;

    if (opts.btcUnit === 'BTC') {
      btcUnit = opts.useBtcSymbol ? 'shortBTC' : 'longBTC';
    }

    formattedCurrency = app.polyglot.t(`bitcoinCurrencyFormat.${btcUnit}`, {
      amount: formattedAmount,
      symbol: curSymbol,
    });
  } else {
    formattedCurrency = new Intl.NumberFormat(opts.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return formattedCurrency;
}

let exchangeRates = {};

/**
 * Will fetch exchange rate data from the server. This is already called
 * on an interval via exchangeRateSyncer.js, so it's unlikely you would
 * need to call this method. Instead access cached values via getExchangeRate()
 * or more commonly convertCurrency().
 */
export function fetchExchangeRates(options = {}) {
  const xhr = $.get(app.getServerUrl('ob/exchangerates/'), options)
    .done((data) => (exchangeRates = data));

  events.trigger('fetching-exchange-rates', { xhr });

  return xhr;
}

export function getExchangeRate(currency) {
  if (!currency) {
    throw new Error('Please provide a currency.');
  }

  return exchangeRates[currency];
}

export function NoExchangeRateDataError(message) {
  this.message = message || 'Missing exchange rate data';
  this.name = 'NoExchangeRateDataError';
  this.stack = (new Error()).stack;
}

NoExchangeRateDataError.prototype = Object.create(Error.prototype);
NoExchangeRateDataError.prototype.constructor = NoExchangeRateDataError;

/**
 * Converts an amount from one currency to another based on exchange
 * rate data.
 */
export function convertCurrency(amount, fromCur, toCur) {
  const fromCurCaps = fromCur.toUpperCase();
  const toCurCaps = toCur.toUpperCase();

  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number');
  }

  if (isNaN(amount)) {
    throw new Error('Please provide an amount that is not NaN');
  }

  if (typeof fromCurCaps !== 'string') {
    throw new Error('Please provide a fromCur as a string');
  }

  if (typeof toCurCaps !== 'string') {
    throw new Error('Please provide a toCur as a string');
  }

  if (fromCurCaps === toCurCaps) {
    return amount;
  }

  if (!exchangeRates[fromCurCaps]) {
    throw new NoExchangeRateDataError(`We do not have exchange rate data for ${fromCurCaps}.`);
  }

  if (!exchangeRates[toCurCaps]) {
    throw new NoExchangeRateDataError(`We do not have exchange rate data for ${toCurCaps}.`);
  }

  const fromRate = fromCurCaps === 'BTC' || fromCurCaps === 'TBTC' ?
      1 : getExchangeRate(fromCurCaps);
  const toRate = toCurCaps === 'BTC' || toCurCaps === 'TBTC' ? 1 : getExchangeRate(toCurCaps);

  return (amount / fromRate) * toRate;
}

/**
 * Convenience function to both convert and format a currency amount using
 * convertCurrency() and formatCurrency().
 */
export function convertAndFormatCurrency(amount, fromCur, toCur, options = {}) {
  const opts = {
    locale: app && app.localSettings && app.localSettings.get('language') || 'en-US',
    btcUnit: app && app.localSettings && app.localSettings.get('bitcoinUnit') || 'BTC',
    skipConvertIfNoExchangeRateData: true,
    ...options,
  };

  let convertedAmt;
  let outputFormat = toCur;

  try {
    convertedAmt = convertCurrency(amount, fromCur, toCur);
  } catch (e) {
    if (e instanceof NoExchangeRateDataError && opts.skipConvertIfNoExchangeRateData) {
      // We'll use an unconverted amount
      convertedAmt = amount;
      outputFormat = fromCur;
    } else {
      throw e;
    }
  }

  return formatCurrency(convertedAmt, outputFormat,
    _.omit(opts, 'skipConvertIfNoExchangeRateData'));
}
