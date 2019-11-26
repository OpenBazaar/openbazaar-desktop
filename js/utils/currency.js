import _ from 'underscore';
import app from '../app';
import $ from 'jquery';
import bigNumber from 'bignumber.js';
import {
  preciseRound,
  validateNumberType,
  decimalPlaces,
} from './number';
import { Events } from 'backbone';
import { getCurrencyByCode } from '../data/currencies';
import {
  getCurrencyByCode as getWalletCurByCode,
  ensureMainnetCode,
  supportedWalletCurs,
} from '../data/walletCurrencies';
import { getCurrencies as getCryptoListingCurs } from '../data/cryptoListingCurrencies';

const events = {
  ...Events,
};

export { events };

// friendlier for circular dependancies
export function getEvents() {
  return events;
}

export const btcSymbol = '₿';

export class NoExchangeRateDataError extends Error {
  constructor(message) {
    return super(message || 'Missing exchange rate data');
  }
}

export class UnrecognizedCurrencyError extends Error {
  constructor(message) {
    return super(message || 'The currency is not recognized.');
  }
}

export function isValidCoinDivisibility(coinDivisibility) {
  return [
    Number.isInteger(coinDivisibility) && coinDivisibility > 0,
    'The coin divisibility must be an integer greater than 0',
  ];
}

/**
 * Will return information about a currency including its currency data, if available.
 */
export function getCurMeta(currency) {
  if (typeof currency !== 'string' || !currency) {
    throw new Error('Please provide a currrency as a non-empty string.');
  }

  const cur = currency.toUpperCase();
  const curData = getCurrencyByCode(cur, {
    includeWalletCurs: false,
  });

  const walletCur = getWalletCurByCode(cur);

  const isFiat = !!curData;
  const isCryptoListingCur = getCryptoListingCurs().includes(cur);
  const isWalletCur = !!walletCur;

  if (!(
    isFiat || isCryptoListingCur || isWalletCur
  )) {
    throw new UnrecognizedCurrencyError();
  }

  return {
    isFiat,
    isWalletCur,
    isCryptoListingCur,
    // Crypto listing curs don't have any data at this time. They are just a string
    // based code.
    curData: curData || walletCur || null,
  };
}

export function isFiatCur(cur) {
  return getCurMeta(cur).isFiat;
}

export const defaultCryptoCoinDivisibility = 8;
export const defaultFiatCoinDivisibility = 2;

/*
 * Keep in mind that while this function strives to get accurate coin divisibility values,
 * it is always safest to:
 *
 * - When converting an integer obtained from the server to a decimal, if provided, use the
 *   divisibility the server explicitly provides with that amount.
 * - When converting a decimal back to an integer, if the API accepts the divisibility, it's
 *   safest to send it over, so it's clear what value was used.
 *
 * Returns the coin divisibility for the given currency. The first attempt is to get it
 * from the wallet currency map that's obtained from the server. If it's a currency not
 * listed there, the function will attempt to decipher the type of currency (e.g. fiat,
 * crypto listing cur, etc...) and fall back to an appropriate default value.
 * @param {string} currency - currency code
 * @param {object} options
 * @param {object} [options.walletCurDef = app.walletCurDef] - The currency map
 *  provided by the server. You should almost never need to pass this in. It was
 *  really exposed as an option for testing purposes.
 * @returns {number} - An integer representing the provided currency's divisibility.
 */
export function getCoinDivisibility(currency, options = {}) {
  if (typeof currency !== 'string' || !currency) {
    throw new Error('Please provide a currrency as a non-empty string.');
  }

  let walletCurDef = options.walletCurDef;

  if (!walletCurDef) {
    try {
      walletCurDef = app.walletCurDef;
    } catch (e) {
      // pass
    }
  }

  if (!walletCurDef) {
    throw new Error('The wallet currency definition must be provide as an object either ' +
      'passed in as an option or available on the app module.');
  }

  if (walletCurDef[currency]) {
    return walletCurDef[currency].divisibility;
  }

  const curMeta = getCurMeta(currency);

  if (curMeta.isFiat) {
    return 2;
  } else if (curMeta.isWalletCur) {
    return curMeta.curData.coinDivisibility;
  } else if (curMeta.isCryptoListingCur) {
    return defaultCryptoCoinDivisibility;
  }

  throw new UnrecognizedCurrencyError();
}

/*
 * Based on the provided coin divisibility, will return the minimum value
 * that coin divisibility supports (e.g. for 8, 1e-8 will be returned).
 * @param {number} coinDivisibility
 * @param {object} options
 * @param {boolean} [options.returnInStandardNotation = false] - if true wil return
 *   the result in standard notation ('0.00000001' instead of 1e-8). Note the result
 *   will be returned as a string when this option is true.
 * @returns {number} - The minimum supported value for the given
 *   coin divisibility.
 */
export function minValueByCoinDiv(coinDivisibility) {
  const [isValidCoinDiv] = isValidCoinDivisibility(coinDivisibility);

  if (!isValidCoinDiv) {
    throw new Error('The provided coinDivisibility is not valid.');
  }

  return 1 / Math.pow(10, coinDivisibility);
}

/**
 * Converts the amount from a decimal to an integer based on the provided
 * coin divisibility.
 * @param {number|string|BigNumber} value - The number that should be converted to an
 *   integer.
 * @param {number} divisibility - An integer representing the coin divisibility (e.g. for
 *   bitcoin, it is 8)
 * @returns {BigNumber} - A BigNumber instance representing the integer number.
 */
export function decimalToInteger(value, divisibility, options = {}) {
  const opts = {
    returnNaNOnError: true,
    ...options,
  };

  try {
    validateNumberType(value);

    const [isValidDivis, divisErr] = isValidCoinDivisibility(divisibility);

    if (!isValidDivis) {
      throw new Error(divisErr);
    }

    return bigNumber(value)
      .multipliedBy(
        bigNumber(10)
          .pow(divisibility)
      )
      .decimalPlaces(0);
  } catch (e) {
    if (!opts.returnNaNOnError) {
      throw e;
    } else {
      console.error(`Unable to convert ${value} from an decimal to an ` +
        `integer: ${e.message}`);
      return bigNumber();
    }
  }
}

/**
 * Converts the amount from an integer to a decimal based on the provided
 * divisibility.
 * @param {number|string|BigNumber} value - The number that should be converted to
 *   an decimal.
 * @param {number} divisibility - An integer representing the coin divisibility
 *   (e.g. for bitcoin, it is 8)
 * @param {object} options
 * @param {boolean} [options.returnNaNOnError = true] - if true and there's
 *   an error, rather than an exception being thrown, a BigNumber instance evaluating
 *   to NaN will be returned. This will allow templates to just display NaN instead of
 *   bombing on render. It will also allow BigNumber ops (e.g. minus, times, etc...) to
 *   not bomb.
 * @returns {BigNumber} - A BigNumber instance representing the decimal number.
 */
export function integerToDecimal(value, divisibility, options = {}) {
  const opts = {
    returnNaNOnError: true,
    fieldName: '',
    ...options,
  };

  let returnVal;

  try {
    validateNumberType(value);

    const [isValidDivis, divisErr] = isValidCoinDivisibility(divisibility);

    if (!isValidDivis) {
      throw new Error(divisErr);
    }

    const result = bigNumber(value)
      .dividedBy(
        bigNumber(10)
          .pow(divisibility)
      );

    if (result.isNaN()) {
      throw new Error('result is not a number');
    }

    returnVal = result;
  } catch (e) {
    if (!opts.returnNaNOnError) {
      throw e;
    } else {
      console.error(`Unable to convert ${opts.fieldName ? `${opts.fieldName}: ` : ''}` +
        `${value} from an integer to a decimal: ${e.message}`);
      return bigNumber();
    }
  }

  return returnVal;
}

/**
 * Returns true if the given amount with the given maxDecimals results
 * in a value of zero.
 */
export function isFormattedResultZero(amount, maxDecimals) {
  if (maxDecimals === 0) return true;

  return (
    preciseRound(amount, maxDecimals) <
      parseFloat(`.${'0'.repeat(maxDecimals - 1)}1`)
  );
}

const MAX_NUMBER_FORMAT_DISPLAY_DECIMALS = 100;

/**
 * The idea of this function is that many times for display purposes, you want to
 * limit the number of decimals displayed on price (e.g. $1.34 instead of $1.3421,
 * 0.0023 BTC instead of 0.00238734 BTC), but simply forcing it may result in a zero
 * value on what is otherwise not a zero value (e.g. 0.001 with a maximum decimal
 * places of 2 would result in 0).
 * This function accepts the amount and the desired maximum decimal places and if
 * the result would be zero, it will increase the desired max until at least one
 * significant digit is shown. For example, a call of 0.0001 with a desired max of 2,
 * would return 4.
 * Note that this mimics the behavior of Intl.NumberFormat which will round up. So,
 * 0.005 with a desired max of 2 will return two because when formatted it will
 * result in 0.01.
 * @param {number|string} amount
 * @param {number} desiredMax - An integer intdicating the desired number of decimal
 *   places.
 * @returns {number} - An integer with the computed maximum decimal places.
 */
function getMaxDisplayDigits(amount, desiredMax) {
  validateNumberType(amount);

  if (typeof desiredMax !== 'number') {
    throw new Error('Please provide the desiredMax as a number.');
  }

  if (amount === 0) {
    return desiredMax;
  }

  let max = desiredMax;

  if (max === 0) {
    return 0;
  }

  while (
    isFormattedResultZero(amount, max) &&
    max < MAX_NUMBER_FORMAT_DISPLAY_DECIMALS
  ) {
    max++;
  }

  return max < desiredMax ? desiredMax : max;
}

/**
 * Returns a boolean indicating whether the number can properly be formatted
 * by Intl.NumberFormat. Certain numbers that are too big or have too many decimal
 * places or too many significant digits will be rounded or otherwise adjusted by
 * Intl.NumberFormat. In many cases, such a change of the number is not desired and
 * this function will allow you to identify if that will happen and have the potential
 * to use other functionality, e.g. BigNumber.toFixed() (keep in mind though, that
 * option will properly show an untruncated / unrounded number, but it will not localize
 * the number at all).
 * @param {number|string|BigNumber} val
 * @param {number} maxDecimals - An integer indicating the maximum number of decimal
     places allowed.
 * @returns {boolean} - A boolean indicating whether the number can properly be formatted
     by Intl.NumberFormat.
 */
export function nativeNumberFormatSupported(val, maxDecimals = 20) {
  validateNumberType(val);

  if (!(Number.isInteger(maxDecimals) && maxDecimals >= 0)) {
    throw new Error('maxDecimals must be provided as an integer >= 0.');
  }

  const bigNum = bigNumber(val).dp(maxDecimals);
  const split = bigNum
    .toFormat({
      ...bigNumber.config().FORMAT,
      groupSeparator: '',
      fractionGroupSeparator: '',
    })
    .split('.');

  if (split[0] === '0' && split[1]) {
    if (split[1].length > 20) return false;
  } else {
    const intLen = split[0] && split[0].length || 0;
    const fractionLen = split[1] && split[1].length || 0;

    if (intLen + fractionLen > 16) return false;
  }

  const int = bigNumber(split[0]);
  const fraction = bigNumber(split[1]);

  if (
    !int.isNaN() &&
    int.gt(Number.MAX_SAFE_INTEGER)
  ) {
    return false;
  }

  if (
    !fraction.isNaN() &&
    fraction.gt(Number.MAX_SAFE_INTEGER)
  ) {
    return false;
  }

  return true;
}

/**
 * Will format an amount in the given currency into the format appropriate for the given
 * locale.
 * @param {number|string|BigNumber} amount
 * @param {string} currency
 * @returns {string} - A string representing the formatted amount in the given
 *   currency and locale.
 */
export function formatCurrency(amount, currency, options) {
  const opts = {
    locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang() || 'en-US',
    btcUnit: app && app.localSettings &&
      app.localSettings.get('bitcoinUnit') || 'BTC',
    // For crypto currencies, if a symbol is specified in the cryptoCurrencies data
    // module, it will be displayed in liu of the currency code.
    useCryptoSymbol: true,
    // If you just want to format a number representing a crypto currency amount
    // but don't want any code or symbol used, set to false.
    includeCryptoCurIdentifier: true,
    // If true and the amount is greater than zero, maxDisplayDecimals will be
    // raised as necessary to avoid a formatted result being 0.
    extendMaxDecimalsOnZero: true,
    ...options,
  };

  // If the value falls within the range supported by Intl.NumberFormat, which is quite
  // large, then Intl.NumberFormat will be used and the number will be formatted in
  // a localized way. If it falls outside of the supported range, then we will fallback
  // to BigNumber.toFormat(). Please keeep in mind though, BigNumber.toFormat() will not
  // localize the number.
  const formatAmount = (value, locale, formatAmountOpts = {}) => {
    const maxDecimals = formatAmountOpts.maximumFractionDigits;
    const minDecimals = formatAmountOpts.minimumFractionDigits;

    if (nativeNumberFormatSupported(value, maxDecimals)) {
      return new Intl.NumberFormat(
        opts.locale,
        formatAmountOpts
      ).format(value);
    }

    let rounded = bigNumber(value)
      .dp(maxDecimals)
      .toString();

    if (Number.isInteger(minDecimals)) {
      const split = rounded.split('.');
      const int = split[0];
      const fraction = split[1];

      if (fraction && fraction.length < minDecimals) {
        const trailingZeros = '';
        trailingZeros.padEnd(minDecimals - fraction.length, '0');
        rounded = `${int}.${fraction}${trailingZeros}`;
      }
    }

    const formattedValue = bigNumber(rounded).toFormat();

    return formattedValue;
  };

  validateNumberType(amount);

  const bigAmount = bigNumber(amount);

  if (typeof opts.locale !== 'string') {
    throw new Error('Please provide a locale as a string');
  }

  if (typeof currency !== 'string') {
    throw new Error('Please provide a currency as a string');
  }

  const cur = currency.toUpperCase();
  let isFiat = false;
  let isWalletCur = false;
  let isCryptoListingCur = false;
  let curData = null;

  try {
    const curMeta = getCurMeta(cur);
    isFiat = curMeta.isFiat;
    isWalletCur = curMeta.isWalletCur;
    isCryptoListingCur = curMeta.isCryptoListingCur;
    curData = curMeta.curData;
  } catch (e) {
    if (e instanceof UnrecognizedCurrencyError) {
      // We'll just assume it's a crypto listing currency. This function would only affect
      // formatting - not any vital calculations.
      isCryptoListingCur = true;
    } else {
      console.error('Unable to format the currency because the currency meta could not ' +
        `be obtained: ${e.message}`);
      return '';
    }
  }

  let formattedCurrency;

  if (isFiat) {
    opts.minDisplayDecimals = typeof opts.minDisplayDecimals === 'number' ?
      opts.minDisplayDecimals : 2;
  } else {
    opts.minDisplayDecimals = typeof opts.minDisplayDecimals === 'number' ?
      opts.minDisplayDecimals : 0;
  }

  if (typeof opts.maxDisplayDecimals !== 'number') {
    try {
      opts.maxDisplayDecimals = getCoinDivisibility(cur);
    } catch (e) {
      // It just means it might display with more zeros than it should - just a cosmetic thing.
      opts.maxDisplayDecimals = defaultCryptoCoinDivisibility;
    }
  }

  if (
    bigAmount.gt(0) &&
    opts.extendMaxDecimalsOnZero
  ) {
    opts.maxDisplayDecimals = getMaxDisplayDigits(bigAmount, opts.maxDisplayDecimals);
  }

  if (isWalletCur) {
    let curSymbol = opts.useCryptoSymbol && curData.symbol || cur;
    let amt = bigAmount;

    if (cur === 'BTC' || cur === 'TBTC') {
      switch (opts.btcUnit) {
        case 'MBTC':
          curSymbol = 'mBTC';
          amt = amt.multipliedBy(1000);
          break;
        case 'UBTC':
          curSymbol = 'μBTC';
          amt = amt.multipliedBy(1000000);
          break;
        case 'SATOSHI':
          curSymbol = 'sat';
          amt = amt.multipliedBy(100000000);
          break;
        default:
          // pass
      }

      amt = amt.toString();
    }

    formattedCurrency = formatAmount(amt, opts.locale, {
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: opts.maxDisplayDecimals,
    });

    if (opts.includeCryptoCurIdentifier) {
      const translationSubKey = curSymbol === curData.symbol ?
        'curSymbolAmount' : 'curCodeAmount';
      formattedCurrency = app.polyglot.t(`cryptoCurrencyFormat.${translationSubKey}`, {
        amount: formattedCurrency,
        [curSymbol === curData.symbol ? 'symbol' : 'code']: curSymbol,
      });
    }
  } else if (isCryptoListingCur) {
    formattedCurrency = formatAmount(bigAmount, opts.locale, {
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: opts.maxDisplayDecimals,
    });

    if (opts.includeCryptoCurIdentifier) {
      formattedCurrency = app.polyglot.t('cryptoCurrencyFormat.curCodeAmount', {
        amount: formattedCurrency,
        code: cur.length > 8 ?
          `${cur.slice(0, 8)}…` : cur,
      });
    }
  } else {
    // Note if the amount provided has too many decimals for Intl.NumberFormat to display,
    // the formatting function for bigNumber.js will be used, but that will neither localize
    // nor style the result as currency. It should be rare that is needed.
    formattedCurrency = formatAmount(
      bigAmount,
      opts.locale,
      {
        style: 'currency',
        currency,
        minimumFractionDigits: opts.minDisplayDecimals,
        maximumFractionDigits: opts.maxDisplayDecimals,
      }
    );
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

  let isWalletCur = false;

  try {
    isWalletCur = getCurMeta(currency).isWalletCur;
  } catch (e) {
    // pass
  }

  const cur = isWalletCur ? ensureMainnetCode(currency) : currency;

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
 * @param {number|string|BigNumber} amount - Note that if you do provide the number as
 *   as a string, you do risk precision loss if the number is beyond the bounds that
 *   JS can natively handle.
 * @param {string} fromCur - The currency you are converting from.
 * @param {string} toCur - The currency you are converting to.
 * @returns {number|string|BigNumber} - The converted amount. The return type will
 *   match the type of the provided amount.
 */
export function convertCurrency(amount, fromCur, toCur) {
  validateNumberType(amount);

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

  const bigNum = amount instanceof bigNumber ?
    amount : bigNumber(amount);

  const converted =
    bigNum
      .times(toRate / fromRate);

  if (amount instanceof bigNumber) {
    return converted;
  } else if (typeof amount === 'string') {
    return converted.toString();
  }

  return Number(converted.toString());
}

/**
 * Convenience function to both convert and format a currency amount using convertCurrency()
 * and formatCurrency().
 */
export function convertAndFormatCurrency(amount, fromCur, toCur, options = {}) {
  const opts = {
    locale: app && app.localSettings && app.localSettings.standardizedTranslatedLang() || 'en-US',
    btcUnit: app && app.localSettings && app.localSettings.get('bitcoinUnit') || 'BTC',
    skipConvertOnError: true,
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

  return (
    formatCurrency(
      convertedAmt,
      outputFormat,
      _.omit(opts, ['skipConvertOnError'])
    )
  );
}

/**
 * Will render a pairing of currencies, most commonly used to show a crypto currency
 * along with it's fiat equivalent (e.g. $2.33 (0.0002534 BTC)). If it cannot show the
 * "to" currency (e.g. exchange rate data not available), it will just show the "from".
 * If the "from" currency is invalid, it will render an empty string.
 */
export function renderPairedCurrency(price, fromCur, toCur) {
  let result;

  try {
    const fromCurExchangeRate = getExchangeRate(fromCur);
    const toCurExchangeRate = getExchangeRate(toCur);
    const formattedBase = formatCurrency(price, fromCur);
    const formattedConverted =
      fromCur === toCur ||
      typeof fromCurExchangeRate !== 'number' ||
      typeof toCurExchangeRate !== 'number' ?
        '' : convertAndFormatCurrency(price, fromCur, toCur);

    result = formattedBase;

    if (formattedConverted) {
      result = app.polyglot.t('currencyPairing', {
        baseCurValue: formattedBase,
        convertedCurValue: formattedConverted,
      });
    }
  } catch (e) {
    result = '';
    console.error('Unable to render the paired currency. Returning an empty string. ' +
      `Error: ${e.message}`);
  }

  return result;
}

/**
 * Will return a string based amount along with a currency definition.
 * @param {number|string|BigNumber} amount
 * @param {string} curCode - The currency the amount is in.
 * @param {object} [options={}] - Function options
 * @param {number} [options.divisibility] - The divisibility of the amount. If not
 *   provided, it will be obtained from getCoinDivisibility().
 * @returns {BigNumber} - An object containing a BigNumber instance of the amount as an
 *   integer as well as a currency definition.
 */
export function decimalToCurDef(amount, curCode, options = {}) {
  const opts = {
    amountKey: 'amount',
    currencyKey: 'currency',
    ...options,
  };

  validateNumberType(amount);

  if (typeof curCode !== 'string' || !curCode) {
    throw new Error('The curCode must be provided as a non-empty string.');
  }

  let divisibility = opts.divisibility;

  try {
    divisibility = divisibility === undefined ?
      getCoinDivisibility(curCode) : divisibility;
  } catch (e) {
    // If unable to obtain a divisibility, we'll just default to the crypto listing curs
    // default.
    divisibility = defaultCryptoCoinDivisibility;
  }

  const [isValidDivis, divisErr] = isValidCoinDivisibility(divisibility);

  if (!isValidDivis) {
    throw new Error(divisErr);
  }

  const convertedAmount = decimalToInteger(amount, divisibility);

  return {
    [opts.amountKey]: convertedAmount,
    [opts.currencyKey]: {
      code: curCode,
      divisibility,
    },
  };
}

/**
 * Will return a BigNumber representation of a decimal number based off of the
 * provided currency definition.
 * @param {object} curDef - A currency definition matching the OB-go cur def
 *   schema.
 * @param {object} options
 * @param {string} options.amount - The property name representing the amount
 *   in the provided curDef object.
 * @param {string} options.currency - The property name representing the currency
 *   object in the provided curDef object.
 * @param {any} [options.returnOnError = bigNumber()] - The value that will be returned
 *   if there is an error in the process. Set the option to false if you'd rather the
 *   function throw an exception on error.
 * @returns {BigNumber} - a BigNumber representation of a decimal number based off
 * of the provided currency definition.
 */
export function curDefToDecimal(curDef, options = {}) {
  const opts = {
    returnOnError: bigNumber(),
    amountKey: 'amount',
    currencyKey: 'currency',
    ...options,
  };

  let converted = opts.returnOnError;

  try {
    if (typeof curDef !== 'object') {
      throw new Error('The curDef must be provided as an object.');
    }

    const amount = curDef[opts.amountKey];
    const currency = curDef[opts.currencyKey];

    validateNumberType(amount, {
      fieldName: `curDef.${opts.amountKey}`,
    });

    if (typeof currency !== 'object') {
      throw new Error('The currency must be an object');
    }

    const [isValidCoinDiv, divisErr] = isValidCoinDivisibility(currency.divisibility);

    if (!isValidCoinDiv) {
      throw new Error(divisErr);
    }

    converted = integerToDecimal(
      amount,
      currency.divisibility
    );
  } catch (e) {
    console.error(`Unable to convert the given currency definition to a decimal: ${e.message}`);
    if (!opts.returnOnError) throw e;
  }

  return converted;
}

export const CUR_VAL_RANGE_TYPES = {
  GREATER_THAN_ZERO: 1,
  GREATER_THAN_OR_EQUAL_ZERO: 2,
};

let rangeTypeValues;

function isValidRangeType(type) {
  if (!rangeTypeValues) {
    rangeTypeValues =
      Object
        .keys(CUR_VAL_RANGE_TYPES)
        .map(key => CUR_VAL_RANGE_TYPES[key]);
  }

  return rangeTypeValues.includes(type);
}

/**
 * Validates a given amount based on the provided divisibility.
 * @param {numer|string|BigNumber} amount - The amount to validate.
 * @param {object} options
 * @param {boolean} [options.requireBigNumAmount = true] - if true, requires
 *   the amount to be a BigNumber instance, otherwise numbers and strings are
 *   also allowed.
 * @param {string} [options.rangeType = CUR_VAL_RANGE_TYPES.GREATER_THAN_ZERO] -
 *   the type of range validation to apply. See CUR_VAL_RANGE_TYPES.
 * @returns {object} - An object containing a series of booleans indicating whether
 *   particular validations passed:
 *   - validCoinDiv: indicates whether the provided divisibility is valid
 *   - validRequired: indicates whether the provided amount contains a value as
 *     opposed to null, empty string or undefined. If this validation fails, the
 *     others below will not be tested.
 *   - validType: indicates whether the amount is the right type depending on
 *     option.requireBigNumAmount. If this validation fails, the
 *     others below will not be tested.
 *   - validRange: indicates whether the amount falls within the correct range.
 *     Depends on options.rangeType.
 *   - validFractionDigitCount: indicates whether the fraction digits in the amount
 *     exceed the maximum supported fraction digits for the given divisibility. This
 *     will not be tested if validCoinDiv fails.
 *   - minValue: This is not a boolean, rather an integer indicating the maximum
 *     fraction digits supported by th divisibility. It's potentially useful to show in
 *     an error message if validFractionDigitCount fails. This will not be provided if
 *     validCoinDiv fails.
 */
export function validateCurrencyAmount(amount, divisibility, options = {}) {
  const opts = {
    requireBigNumAmount: true,
    rangeType: CUR_VAL_RANGE_TYPES.GREATER_THAN_ZERO,
    ...options,
  };

  if (!isValidRangeType(opts.rangeType)) {
    throw new Error('You have provided an invalid range type.');
  }

  const [isValidCoinDiv] = isValidCoinDivisibility(divisibility);

  const returnVal = {
    validCoinDiv: isValidCoinDiv,
  };

  if (
    typeof amount === 'undefined' ||
    amount === '' ||
    amount === null
  ) {
    returnVal.validRequired = false;
    return returnVal;
  }

  returnVal.validRequired = true;

  const bigNum = bigNumber(amount);

  if (
    (
      opts.requireBigNumAmount &&
      !(amount instanceof bigNumber)
    ) ||
    (bigNum.isNaN())
  ) {
    returnVal.validType = false;
    return returnVal;
  }

  returnVal.validType = true;

  switch (opts.rangeType) {
    case CUR_VAL_RANGE_TYPES.GREATER_THAN_ZERO:
      returnVal.validRange = bigNum.gt(0);
      break;
    case CUR_VAL_RANGE_TYPES.GREATER_THAN_OR_EQUAL_ZERO:
      returnVal.validRange = bigNum.gte(0);
      break;
    default:
      // pass
  }

  if (isValidCoinDiv) {
    returnVal.validFractionDigitCount =
      decimalPlaces(amount) <= divisibility;
    returnVal.minValue = minValueByCoinDiv(divisibility);
  }

  return returnVal;
}
