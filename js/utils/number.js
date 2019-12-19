import bigNumber from 'bignumber.js';
import app from '../app';

/*
 * Will return a string representation of a number ensuring that standard
 * notation is used (as opposed to the default JS representation which uses
 * scientific notation for small numbers, e.g. 0.00000001 => 1E-8).
 * @param {number|string|BigNumber} number
 * @returns {string} - String based number in standard notation.
 */
export function toStandardNotation(number, options) {
  const opts = {
    returnUnchangedOnError: true,
    ...options,
  };

  try {
    const bigNum = bigNumber(number);

    if (bigNum.isNaN()) {
      throw new Error(`${number} is not a valid number.`);
    }

    return (
      bigNum.toFormat({
        ...bigNumber.config().FORMAT,
        groupSeparator: '',
        fractionGroupSeparator: '',
      })
    );
  } catch (e) {
    if (opts.returnUnchangedOnError) return number;
    throw e;
  }
}

/*
 * Like Number.toFixed, but whereas that will force your number
 * to have the specified number of decimal places, this will not
 * allow you to have more than the specified number, but will allow
 * less, e.g:
 *
 * (18.986).toFixed(2) // 18.99
 * upToFixed(18.986,2) // 18.99
 * (18.986).toFixed(4) // 18.9860
 * upToFixed(18.986, 4) // 18.986
 */
export function upToFixed(number, decPlaces) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  return toStandardNotation(
    parseFloat((number).toFixed(decPlaces))
  ).toString();
}

/*
 * Returns a random integer from min to (min + range).
 *
 * https://stackoverflow.com/questions/13997793/generate-random-number-between-2-numbers
 */
export function randomInt(min = 0, range = 0) {
  return Math.floor((Math.random() * (range + 1)) + min);
}

/*
 * Uses local setting's language or provided optional language to return a localized
 * string representing the provided number.
 *
 * ex: number='30000.05', lang='en-us' => 30,000.05
 * ex: number='30000.05', lang='ru' => 30 000,05
 * ex: number='30000.05', lang='es' => 30.000,05
*/
export function localizeNumber(number,
  lang = app && app.localSettings && app.localSettings.standardizedTranslatedLang() || 'en-US'
 ) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  return new Intl.NumberFormat(lang).format(number);
}

/*
 * Returns the number of decimal places in a number (trailing 0's don't count).
 * @param {number|string|BigNumber} num
 * @returns {number} - The number of significant decimal places.
 */
// https://stackoverflow.com/a/10454560
export function decimalPlaces(num) {
  const bigNum = bigNumber(num);

  // trim trailing zeros
  const trimmed = String(bigNum.toFormat()).replace(/0+$/, '');
  const match = trimmed.match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
    0,
    // Number of digits right of decimal point.
    (match[1] ? match[1].length : 0)
    // Adjust for scientific notation.
    - (match[2] ? +match[2] : 0)
 );
}

/*
 * Rounds the value to the given number of decimal places.
 * @param {number|string|BigNumber} value
 * @param {number} precision - The desired number of decimal places.
 * @returns {number|string|BigNumber} - The rounded number with the return type
 *   matching the type of the provided value.
 */
// https://stackoverflow.com/a/7343013/632806
export function preciseRound(value, precision) {
  const bigNum = bigNumber(value);

  const rounded = bigNum
    .decimalPlaces(precision);

  if (typeof value === 'number') {
    return rounded.toNumber();
  } else if (typeof value === 'string') {
    return rounded.toString();
  }

  return rounded;
}

const isValidNumberDefaultAllows = {
  allowNumber: true,
  allowBigNumber: true,
  allowString: true,
};

/*
 * Returns true if the provided number is a valid number type.
 * @param {number|string|BigNumber} num
 * @param {object} options
 * @param {boolean} [options.allowNumber = true] - If the num is the JS "number"
 *   type, it will be considered valid. NaN is considered valid.
 * @param {boolean} [options.allowBigNumber = true] - If the num is a BigNumber
 *   instance, it will be considered valid (even if the instance evaluates to NaN).
 * @param {boolean} [options.allowString = true] - If the num is a valid string based
 *   number (as detrmined by BigNumber), it will be considered valid. If the BigNumber
 *   evaluates the string to NaN, it will be considered invalid.
 * @returns {boolean} - Boolean indicating whether num is a valid number.
 */
export function isValidNumber(num, options = {}) {
  const opts = {
    ...isValidNumberDefaultAllows,
    ...options,
  };

  if (
    !opts.allowNumber &&
    !opts.allowBigNumber &&
    !opts.allowString
  ) {
    throw new Error('At least one of allowNumber, allowBigNumber or allowString must ' +
      'be true.');
  }

  if (
    opts.allowNumber &&
    typeof num === 'number'
  ) {
    return true;
  }

  if (
    opts.allowBigNumber &&
    num instanceof bigNumber
  ) {
    return true;
  }

  if (opts.allowString) {
    const bigNum = bigNumber(num);
    return !bigNum.isNaN();
  }

  return false;
}

/*
 * Uses isValidNumber() to determine whether the provided num is a valid number. If it's
 * not, a descriptive exception will be thrown.
 * @param {number|string|BigNumber} num
 * @param {object} options
 * @param {string} [options.fieldName = 'value'] - The name of the variable you are trying
 *   to validate. The name will be used in the exception string.
 * @param {object} [options.isValidNumberOpts = {}] - The options to be passed to
 *   isValidNumber().
 */
export function validateNumberType(num, options = {}) {
  const opts = {
    fieldName: 'value',
    isValidNumberOpts: {},
    ...options,
  };

  const isValidNumberAllows = {
    ...isValidNumberDefaultAllows,
    ...opts.isValidNumberOpts,
  };

  if (!isValidNumber(num, opts.isValidNumberOpts)) {
    const errStr = `The ${opts.fieldName} must be provided as one of`;
    const allowedTypes = [];

    if (isValidNumberAllows.allowNumber) {
      allowedTypes.push('number');
    }

    if (isValidNumberAllows.allowBigNumber) {
      allowedTypes.push('bigNumber.js instance');
    }

    if (isValidNumberAllows.allowString) {
      allowedTypes.push('string based representation of a number');
    }

    throw new Error(`${errStr}: ${allowedTypes.join(', ')}`);
  }
}
