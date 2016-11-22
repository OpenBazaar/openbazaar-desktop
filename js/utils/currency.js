import app from '../app';
import $ from 'jquery';
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

  const decimalPlaces = isBtc ? 8 : 2;

  return price.toFixed(decimalPlaces);
}

// todo: check currency is one of our currencies
export function formatCurrency(amount, currency, locale = app.settings.get('language')) {
  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number');
  }

  if (isNaN(amount)) {
    throw new Error('Please provide an amount that is not NaN');
  }

  if (typeof locale !== 'string') {
    throw new Error('Please provide a locale as a string');
  }

  if (typeof currency !== 'string') {
    throw new Error('Please provide a currency as a string');
  }

  let formattedCurrency;

  if (currency !== 'BTC') {
    formattedCurrency = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } else {
    // going to use USD just to know the localized placement of the $, which we'll swap
    // out with the Bitcoin symbol
    formattedCurrency = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 8,
    }).format(amount);

    // Using the ฿ char for the Bitcoin symbol which will be replaced by the real Bitcoin symbol
    // once we bring in a Bitcoin font, e.g:
    // http://www.righto.com/2015/02/how-to-display-bitcoin-symbol-using_14.html
    formattedCurrency = formattedCurrency.replace('$', '฿');
  }

  return formattedCurrency;
}

let exchangeRates = {};

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

// todo: unit test me
// probably need sinon to stub / mock fetchExchangeRates
export function convertCurrency(amount, fromCur, toCur) {
  if (typeof amount !== 'number') {
    throw new Error('Please provide an amount as a number');
  }

  if (isNaN(amount)) {
    throw new Error('Please provide an amount that is not NaN');
  }

  if (typeof fromCur !== 'string') {
    throw new Error('Please provide a fromCur as a string');
  }

  if (typeof toCur !== 'string') {
    throw new Error('Please provide a toCur as a string');
  }

  if (fromCur === toCur) {
    return amount;
  }

  if (!exchangeRates[fromCur]) {
    throw new NoExchangeRateDataError(`We do not have exchange rate data for ${fromCur}.`);
  }

  if (!exchangeRates[toCur]) {
    throw new NoExchangeRateDataError(`We do not have exchange rate data for ${toCur}.`);
  }

  return amount / (getExchangeRate(fromCur) / getExchangeRate(toCur));
}

// todo: unit test me
// probably need sinon to stub / mock fetchExchangeRates
export function convertAndFormatCurrency(amount, fromCur, toCur, options = {}) {
  const opts = {
    locale: app.settings.get('language'),
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

  return formatCurrency(convertedAmt, outputFormat, opts.locale);
}
