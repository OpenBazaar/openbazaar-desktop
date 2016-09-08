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
