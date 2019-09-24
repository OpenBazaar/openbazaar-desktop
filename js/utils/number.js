import bigNumber from 'bignumber.js';
import app from '../app';

/*
 * Will return a string representation of a number ensuring that standard
 * notation is used (as opposed to the default JS representation which uses
 * scientific notation for small numbers, e.g. 0.00000001 => 1E-8).
 */
console.log('bignum config bump up from 20 max decimalz');
console.log('unit test me.');
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
console.log('doc me up - note this only works on string based numbers');
console.log('is this being called anywhere with the expectation it work on number numbrs?');
console.log('can this without too much pain work on numbers?');
export function decimalPlaces(num) {
  // trim trailing zeros
  const trimmed = String(num).replace(/0+$/, '');
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

const isValidNumberDefaultAllows = {
  allowNumber: true,
  allowBigNumber: true,
  allowString: true,
};

console.log('unit test me silly style');
console.log('doc me up more');
/*
 * Returns true if the provided string is a valid number as determined by
 * bigNumber.js.
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
    typeof num === 'number' &&
    !isNaN(num)
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

console.log('docs me uppers and write unit testy.');
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
