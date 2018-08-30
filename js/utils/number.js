import app from '../app';

/*
 * Will return a string representation of a number ensuring that standard
 * notation is used (as opposed to the default JS representation which uses
 * scientific notation for small numbers, e.g. 0.00000001 => 1E-8).
 */
export function toStandardNotation(number, options) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  const opts = {
    minDisplayDecimals: 0,
    maxDisplayDecimals: 8,
    ...options,
  };

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: opts.minDisplayDecimals,
    maximumFractionDigits: opts.maxDisplayDecimals,
    useGrouping: false,
  }).format(number);
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
export function upToFixed(number, decimalPlaces) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  return toStandardNotation(
    parseFloat((number).toFixed(decimalPlaces))
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

