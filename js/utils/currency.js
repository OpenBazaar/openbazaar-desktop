import app from '../app';
import _ from 'underscore';
import $ from 'jquery';
import bitcoinConvert from 'bitcoin-convert';
import bigNumber from 'bignumber.js';
import { upToFixed, preciseRound } from './number';
import { Events } from 'backbone';
import currencies, { getCurrencyByCode, isFiatCur } from '../data/currencies';
import {
  getCurrencyByCode as getWalletCurByCode,
  ensureMainnetCode,
  supportedWalletCurs,
} from '../data/walletCurrencies';
import { getCurrencies as getCryptoListingCurs } from '../data/cryptoListingCurrencies';
import loadTemplate from '../utils/loadTemplate';

const events = {
  ...Events,
};

export { events };

// friendlier for circular dependancies
export function getEvents() {
  return events;
}

export const btcSymbol = '₿';

export function NoExchangeRateDataError(message) {
  this.message = message || 'Missing exchange rate data';
  this.name = 'NoExchangeRateDataError';
  this.stack = (new Error()).stack;
}

NoExchangeRateDataError.prototype = Object.create(Error.prototype);
NoExchangeRateDataError.prototype.constructor = NoExchangeRateDataError;

export function UnrecognizedCurrencyError(message) {
  this.message = message || 'The currency is not recognized.';
  this.name = 'UnrecognizedCurrencyError';
  this.stack = (new Error()).stack;
}

UnrecognizedCurrencyError.prototype = Object.create(Error.prototype);
UnrecognizedCurrencyError.prototype.constructor = UnrecognizedCurrencyError;

/**
 * Converts the amount from a decimal to an integer based on...
 * // todo: doc me up + params
 * // note most times you'll want to provide a code not the divisibility.
 * // --- simplify by not making cur and divsibility nested???
 * //note divisiblity in exponent format
 */
export function decimalToInteger(value, divisibility) {
  if (typeof value !== 'number') {
    throw new Error('The value must be provided as a number');
  }

  if (typeof divisibility !== 'number') {
    throw new Error('The divisibility must be provided as a number.');
  }

  return bigNumber(value)
    .multipliedBy(
      bigNumber(10)
        .pow(divisibility)
    )
    .toString();
}

/**
 * Converts the amount from an integer to a decimal based on data.divisibility.
 * // todo: doc me up + params
 */
export function integerToDecimal(value, divisibility, options = {}) {
  const opts = {
    returnUndefinedOnError: true,
    ...options,
  };

  let returnVal;

  try {
    if (!['number', 'string'].includes(typeof value)) {
      throw new Error('The value must be provided as a number');
    }

    if (typeof divisibility !== 'number') {
      throw new Error('The divisibility must be provided as a number.');
    }

    const result = bigNumber(value)
      .dividedBy(
        bigNumber(10)
          .pow(divisibility)
      );

    if (result.isGreaterThan(Number.MAX_SAFE_INTEGER)) {
      throw new Error('value higher than we can handle');
    } else {
      returnVal = result.toNumber();

      if (isNaN(returnVal)) {
        if (opts.returnUndefinedOnError) {
          returnVal = undefined;
        } else {
          throw new Error('Unable to convert the value to a ' +
            'valid number.');
        }
      }
    }
  } catch (e) {
    if (!opts.returnUndefinedOnError) {
      throw e;
    }
  }

  return returnVal;
}

/**
 * Will take a number and return a string version of the number with the appropriate number of
 * decimal places based on whether the number represents a crypto or fiat price.
 *
 * This differs from formatCurrency in that this does not localize the number at all. It simply
 * returns the value with the appropriate number of decimal place, e.g:
 *
 * formatPrice(123.456, 'USD') // "123.46"
 * formatPrice(123.456, 'BTC')  // "123.45600000"
 *
 * It is more useful for <input>'s because we are not localizing the numbers in them.
 *
 */

 // is this needed anymore?
 // is this needed anymore?
 // is this needed anymore?
 // is this needed anymore?
 // is this needed anymore?
 // is this needed anymore?

export function formatPrice(price, currency) {
  if (typeof price !== 'number') {
    throw new Error('Please provide a price as a number');
  }

  if (isNaN(price)) {
    throw new Error('Please provide a price that is not NaN');
  }

  if (typeof currency !== 'string') {
    throw new Error('Please provide a currency as a string');
  }

  let convertedPrice;
  // todo: this needs to take into account crypto listing currency codes,
  // which using the method below, would result in most of them being
  // considered as fiat.
  const cryptoCur = getWalletCurByCode(currency);

  if (cryptoCur) {
    // Format crypto price so it has up to the max decimal places (as specified in the crypto
    // config), but without any trailing zeros
    // convertedPrice = upToFixed(price, getSmartMaxDisplayDigits(price, 8));
    // convertedPrice = upToFixed(price, getSmartMaxDisplayDigits(price, 8));
    // convertedPrice = upToFixed(price, getSmartMaxDisplayDigits(price, 8));
    convertedPrice = upToFixed(price, 8);
  } else {
    convertedPrice = price.toFixed(2);
  }

  return convertedPrice;
}

// function getFloatToCheck(m) {
//   const rounded = preciseRound(
//     parseFloat(`.${'0'.repeat(m - 1)}1`),
//     m
//   );

//   console.log(`${m} - ${rounded}`);
//   return rounded;
// }

// TODO: doc me up yo
// TODO: doc me up yo
// TODO: doc me up yo
export function isFormattedResultZero(amount, maxDecimals) {
  return (
    preciseRound(amount, maxDecimals) <
      parseFloat(`.${'0'.repeat(maxDecimals - 1)}1`)
  );
}


// todo: todo: todo: unit test me like a bandit
// todo: doc me up
// note about first sig dig on zero
function getMaxDisplayDigits(amount, desiredMax, maxOnZero = desiredMax) {
  if (typeof amount !== 'number') {
    throw new Error('Please provide the amount as a number.');
  }

  if (typeof desiredMax !== 'number') {
    throw new Error('Please provide the desiredMax as a number.');
  }

  if (!(Number.isInteger(maxOnZero) || maxOnZero === 0)) {
    throw new Error('If provided, maxOnZero must be a positive integer ' +
      'or zero');
  }

  if (amount === 0) {
    return desiredMax;
  }

  const zeroMax = maxOnZero > desiredMax ?
    maxOnZero : desiredMax;

  let max = desiredMax;

  while (
    // amount < getFloatToCheck(max) &&
    isFormattedResultZero(amount, max) &&
    max < zeroMax
  ) {
    max++;
  }

  return max;
}

/**
 * Will return information about a currency including it's currency
 * data, if available.
 */
function _getCurMeta(currency) {
  if (typeof currency !== 'string' || !currency) {
    throw new Error('Please provide a currrency as a non-empty string.');
  }

  const cur = currency.toUpperCase();
  const curData = getCurrencyByCode(cur, {
    includeWalletCurs: false,
  });

  const walletCur = getWalletCurByCode(cur);

  // If we don't recognize the currency, we'll assume it's a crypto
  // listing cur.
  const isCryptoListingCur = getCryptoListingCurs().includes(cur) ||
    (!walletCur && !curData);

  return {
    isFiat: !!curData,
    isWalletCur: !!walletCur,
    isCryptoListingCur,
    curData: curData || walletCur,
  };
}

export const getCurMeta = _.memoize(_getCurMeta);

/**
 * Will format an amount in the given currency into the format appropriate for the given
 * locale. In most cases, instead of using this method directly, you may want to use
 * the views/components/Value view which will truncate if necessary and show the full
 * value in a tooltip.
 */
 // todo: unit test the shiznit out of me!
 // todo: unit test the shiznit out of me!
 // todo: unit test the shiznit out of me!
 // todo: unit test the shiznit out of me!
 // todo: unit test the shiznit out of me!
 // todo: unit test the shiznit out of me!
export function formatCurrency(amount, currency, options = {}) {
  const opts = {
    locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang() || 'en-US',
    btcUnit: app && app.localSettings &&
      app.localSettings.get('bitcoinUnit') || 'BTC',
    // For wallet currencies, if a symbol is specified in the cryptoCurrencies data
    // module, it will be displayed in liu of the currency code.
    useCryptoSymbol: true,
    minDisplayDecimals: 2,
    maxDisplayDecimals: 2,
    // If the resulting amount based on maxDisplayDecimals would be 0, then this
    // value is how much further you're willing to go to not show a zero. For
    // example if the amount is .0001 and your maxDisplayDecimals is 2, but
    // your maxDisplayDecimalsOnZero is 4, then .0001 would be shown.
    // -- goes up to first significant digit
    // -- goes up to first significant digit
    // -- goes up to first significant digit
    // -- goes up to first significant digit
    maxDisplayDecimalsOnZero: 6,
    // This is passed into Intl.NumberFormat. If you just want to format a number
    // in a localized way, but not as a currency, pass in 'decimal'. For more
    // info look at the Intl.NumberFormat docs.
    style: 'currency',
    ...options,
  };

  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }

  if (typeof currency !== 'string') {
    throw new Error('Please provide a currency as a string');
  }

  if (
    !['object', 'function', 'undefined']
      .includes(typeof options)
  ) {
    throw new Error('If passing in options, they must be an object ' +
      'or a function.');
  }

  if (typeof opts.locale !== 'string') {
    throw new Error('Please provide a locale as a string');
  }

  const cur = currency.toUpperCase();
  const {
    isWalletCur,
    isCryptoListingCur,
    curData,
  } = getCurMeta(cur);

  let formattedCurrency;

  if (isWalletCur) {
    let curSymbol = opts.useCryptoSymbol && curData.symbol || cur;
    let bitcoinConvertUnit;
    let amt = amount;

    if (cur === 'BTC' || cur === 'TBTC') {
      switch (opts.btcUnit) {
        case 'MBTC':
          bitcoinConvertUnit = curSymbol = 'mBTC';
          break;
        case 'UBTC':
          bitcoinConvertUnit = curSymbol = 'μBTC';
          break;
        case 'SATOSHI':
          curSymbol = 'sat';
          bitcoinConvertUnit = 'Satoshi';
          break;
        default:
          bitcoinConvertUnit = 'BTC';
      }

      amt = bitcoinConvert(amount, 'BTC', bitcoinConvertUnit);
    }

    const formattedAmount = formattedCurrency = new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: getMaxDisplayDigits(
        amount,
        opts.maxDisplayDecimals,
        opts.maxDisplayDecimalsOnZero
      ),
    }).format(amt);

    if (opts.style === 'currency') {
      const translationSubKey = curSymbol === curData.symbol ?
        'curSymbolAmount' : 'curCodeAmount';
      formattedCurrency = app.polyglot.t(`cryptoCurrencyFormat.${translationSubKey}`, {
        amount: formattedAmount,
        [curSymbol === curData.symbol ? 'symbol' : 'code']: curSymbol,
      });
    }
  } else if (isCryptoListingCur) {
    const formattedAmount = formattedCurrency = new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: getMaxDisplayDigits(
        amount,
        opts.maxDisplayDecimals,
        opts.maxDisplayDecimalsOnZero
      ),
    }).format(amount);

    if (opts.style === 'currency') {
      formattedCurrency = app.polyglot.t('cryptoCurrencyFormat.curCodeAmount', {
        amount: formattedAmount,
        code: cur.length > 8 ?
          `${cur.slice(0, 8)}…` : cur,
      });
    }
  } else {
    formattedCurrency = new Intl.NumberFormat(opts.locale, {
      style: opts.style,
      currency,
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: getMaxDisplayDigits(
        amount,
        opts.maxDisplayDecimals,
        opts.maxDisplayDecimalsOnZero
      ),
    }).format(amount);
  }

  return formattedCurrency;
}

let exchangeRates = {};

/**
 * Will fetch exchange rate data from the server. This is already called on an interval via
 * exchangeRateSyncer.js, so it's unlikely you would need to call this method. Instead access
 * cached values via getExchangeRate() or more commonly convertCurrency().
 */
export function fetchExchangeRates(options = {}) {
  const supportedCurs = supportedWalletCurs();
  let coin;

  if (supportedCurs.length) {
    coin = supportedCurs.includes('BTC') ||
      supportedCurs.includes('TBTC') ?
        'BTC' :
        ensureMainnetCode(supportedCurs[0]);
  }

  const xhr = $.get(app.getServerUrl(`ob/exchangerates/${coin}`), options)
    .done(data => {
      const changed = new Set();

      Object.keys(exchangeRates)
        .forEach(cur => {
          if (exchangeRates[cur] !== data[cur]) {
            changed.add(cur);
          }
        });

      Object.keys(data)
        .forEach(cur => {
          if (data[cur] !== exchangeRates[cur]) {
            changed.add(cur);
          }
        });

      const changedArray = Array.from(changed);
      const prevExchangeRates = JSON.parse(JSON.stringify(exchangeRates));
      exchangeRates = {
        ...data,
        [coin]: 1,
      };

      if (changed.size) {
        events.trigger('exchange-rate-change', { changed: changedArray });
        changedArray.forEach(cur => {
          events.trigger(`exchange-rate-change-${cur}`, { previous: prevExchangeRates[cur] });
        });
      }
    });

  events.trigger('fetching-exchange-rates', { xhr });

  return xhr;
}

/**
 * Will return the exchange rate between the server's crypto currency and the given
 * currency.
 */
export function getExchangeRate(currency) {
  if (!currency) {
    throw new Error('Please provide a currency.');
  }

  const cur = isFiatCur(currency) ? currency : ensureMainnetCode(currency);

  return exchangeRates[cur];
}

/**
 * Will return an object containing all the available exchange rates for your servers
 * crypto currency.
 */
export function getExchangeRates() {
  return exchangeRates;
}

/**
 * Converts an amount from one currency to another based on exchange rate data.
 */
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

  const fromCurCode = ensureMainnetCode(fromCur.toUpperCase());
  const toCurCode = ensureMainnetCode(toCur.toUpperCase());

  if (fromCurCode === toCurCode) {
    return amount;
  }

  if (!exchangeRates[fromCurCode]) {
    throw new NoExchangeRateDataError('We do not have exchange rate data for ' +
      `${fromCur.toUpperCase()}.`);
  }

  if (!exchangeRates[toCurCode]) {
    throw new NoExchangeRateDataError('We do not have exchange rate data for ' +
      `${toCur.toUpperCase()}.`);
  }

  const fromRate = getExchangeRate(fromCurCode);
  const toRate = getExchangeRate(toCurCode);

  return (amount / fromRate) * toRate;
}

/**
 * Convenience function to both convert and format a currency amount using convertCurrency()
 * and formatCurrency(). In many cases, instead of using this method directly, you may want
 * to use renderFormattedCurrency() from this module or its corresponding template helper,
 * formattedCurrency, since those will more robustly handle (via tooltips and icons)
 * unrecognized currency codes and/or conversion problems due to unavailable exchange rate data.
 */
export function convertAndFormatCurrency(amount, fromCur, toCur, options = {}) {
  const opts = {
    // locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang() || 'en-US',
    // btcUnit: app && app.localSettings && app.localSettings.get('bitcoinUnit') || 'BTC',
    skipConvertOnError: true,
    formatOptions: {},
    ...options,
  };

  let convertedAmt;
  let outputFormat = toCur;

  try {
    convertedAmt = convertCurrency(amount, fromCur, toCur);
  } catch (e) {
    if (opts.skipConvertOnError) {
      // We'll use an unconverted amount
      convertedAmt = amount;
      outputFormat = fromCur;
    } else {
      throw e;
    }
  }

  return formatCurrency(convertedAmt, outputFormat, opts.formatOptions);
}

/**
 * Returns `VALID` if the given currency is valid, otherwise it will return a code
 * indicating why it's not valid.
 */
export function getCurrencyValidity(cur) {
  if (typeof cur !== 'string') {
    throw new Error('A currency must be provided as a string.');
  }

  const curData = getCurrencyByCode(cur);
  let returnVal;

  if (curData) {
    returnVal = getExchangeRate(ensureMainnetCode(cur)) ?
      'VALID' : 'EXCHANGE_RATE_MISSING';
  } else {
    returnVal = 'UNRECOGNIZED_CURRENCY';
  }

  return returnVal;
}

// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
// TODO: will this be needed anymore.
/**
 * Will render a formattedCurrency template. The main function of the template is that it will
 * render a localized price when possible. When it is not possible (e.g. an unrecognized currency),
 * it will render an alert icon with a tooltip containing an explanation (assuming you don't pass in
 * the showTooltipOnUnrecognizedCur option as false).
 */
export function renderFormattedCurrency(amount, fromCur, toCur, options = {}) {
  if (typeof fromCur !== 'string' || !fromCur) {
    throw new Error('Please provide a "from currency" as a string.');
  }

  if (toCur && typeof toCur !== 'string') {
    throw new Error('If providing a "to currency", it must be provided as a string.');
  }

  let result = '';

  loadTemplate('components/formattedCurrency.html', (t) => {
    result = t({
      price: amount,
      fromCur,
      toCur: toCur || fromCur,
      ...options,
    });
  });

  return result;
}

/**
 * Will render a pairing of currencies, most commonly used to show a crypto currency
 * along with it's fiat equivalent (e.g. $2.33 (0.0002534 BTC)). If it cannot show the
 * "to" currency (e.g. exchange rate data not available), it will just show the "from".
 * If the "from" currency is invalid, it will render an empty string.
 */
export function renderPairedCurrency(price, fromCur, toCur) {
  const fromCurValidity = getCurrencyValidity(fromCur);

  if (typeof price !== 'number' || fromCurValidity === 'UNRECOGNIZED_CURRENCY') {
    // Sometimes when prices are in an unsupported currency, they will be
    // saved as empty strings or undefined. We'll ignore those an just render an
    // empty string.
    return '';
  }

  const toCurValidity = getCurrencyValidity(toCur);
  const formattedBase = formatCurrency(price, fromCur);
  const formattedConverted = fromCur === toCur || toCurValidity !== 'VALID' ||
    fromCurValidity !== 'VALID' ?
      '' : convertAndFormatCurrency(price, fromCur, toCur);

  let result = formattedBase;

  if (formattedConverted !== '') {
    result = app.polyglot.t('currencyPairing', {
      baseCurValue: formattedBase,
      convertedCurValue: formattedConverted,
    });
  }

  return result;
}
