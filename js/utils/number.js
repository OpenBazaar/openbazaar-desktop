/*
 * Like Number.toFixed, but whereas that will force your number
 * to have the specified number of decimal place, this will not
 * allow you to have more than the specified number, but will allow
 * less, e.g:
 *
 * (18.986).toFixed(2) // 18.99
 * (18.986).upToFixed(2) // 18.99
 * (18.986).toFixed(4) // 18.9860
 * (18.986).toFixed(4) // 18.986
 */
export function upToFixed(number, decimalPlaces) {
  if (typeof number !== 'number') {
    throw new Error('Please provide a number.');
  }

  return parseFloat((number).toFixed(decimalPlaces)).toString();
}
