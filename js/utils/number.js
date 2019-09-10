import bigNumber from 'bignumber.js';
import app from '../app';

/*
 * Will return a string representation of a number ensuring that standard
 * notation is used (as opposed to the default JS representation which uses
 * scientific notation for small numbers, e.g. 0.00000001 => 1E-8).
 */
console.log('explain how max is 20 and put in a check');
export function toStandardNotation(number, options) {
  const opts = {
    minDisplayDecimals: 0,
    maxDisplayDecimals: 20,
    returnUnchangedOnError: true,
    ...options,
  };

  if (!opts.returnUnchangedOnError && typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  let converted;

  try {
    converted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: opts.minDisplayDecimals,
      maximumFractionDigits: opts.maxDisplayDecimals,
      useGrouping: false,
    }).format(number);
  } catch (e) {
    if (opts.returnUnchangedOnError) return number;
    throw e;
  }

  if (isNaN(converted)) return '';

  return converted;
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
 * Uses local settings' language or provided optional language to return a localized
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

// https://stackoverflow.com/a/10454560
export function decimalPlaces(num) {
  const match = (String(num)).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
    0,
    // Number of digits right of decimal point.
    (match[1] ? match[1].length : 0)
    // Adjust for scientific notation.
    - (match[2] ? +match[2] : 0)
 );
}

// todo: doc and put in our style
// todo: doc and put in our style
// todo: doc and put in our style
console.log('todo: doc and put in our style');
// https://stackoverflow.com/a/7343013/632806
export function preciseRound(value, precision) {
  if (typeof value === 'string') {
    const bigNum = bigNumber(value);

    if (bigNum.isNaN()) {
      throw new Error('The provided string does not evaluate to a valid number.');
    }

    return bigNum
      .decimalPlaces(precision)
      .toString();
  }

  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

console.log('unit test me silly style');
/*
 * Returns true if the provided string is a valid number as determined by
 * bigNumber.js.
 */
export function isValidStringBasedNumber(strNumber) {
  if (
    typeof strNumber !== 'string' &&
    typeof strNumber !== 'number'
  ) {
    return false;
  }

  try {
    const bigNum = bigNumber(strNumber);
    return !bigNum.isNaN();
  } catch (e) {
    return false;
  }
}

console.log('docs me uppers and write unit testy.');
export function validateNumberType(strNumber, options = {}) {
  const opts = {
    fieldName: 'value',
    allowStringBasedNumber: true,
    ...options,
  };

  let isValid = true;

  if (typeof strNumber !== 'number') {
    isValid = opts.allowStringBasedNumber ?
      isValidStringBasedNumber(strNumber) : false;
  }

  if (!isValid) {
    throw new Error(`The ${opts.fieldName} must be provided as a number or a string based ` +
      'representation of a number.');
  }
}
