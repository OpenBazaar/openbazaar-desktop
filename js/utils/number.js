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
  }).format(number);
}

/*
 * Like Number.toFixed, but whereas that will force your number
 * to have the specified number of decimal places, this will not
 * allow you to have more than the specified number, but will allow
 * less, e.g:
 *
 * (18.986).toFixed(2) // 18.99
 * (18.986).upToFixed(2) // 18.99
 * (18.986).toFixed(4) // 18.9860
 * (18.986).upToFixed(4) // 18.986
 */
export function upToFixed(number, decimalPlaces) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  return toStandardNotation(
    parseFloat((number).toFixed(decimalPlaces))
  ).toString();
}
