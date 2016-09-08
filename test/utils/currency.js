// import app from '../../js/app';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { decimalToInteger, integerToDecimal } from '../../js/utils/currency';

describe('the currency utility module', () => {
  it('correctly converts a fiat amount from an integer to decimal', () => {
    expect(integerToDecimal(123)).to.equal(1.23);
  });

  it('correctly converts a BTC price from an integer to a decimal', () => {
    expect(integerToDecimal(271453590, true)).to.equal(2.71);
  });

  it('correctly converts a fiat amount from a decimal to an integer', () => {
    expect(decimalToInteger(1.23)).to.equal(123);
  });

  it('correctly converts a fiat amount from a decimal to an integer' +
    ' rounding to the hundreds place.', () => {
    expect(decimalToInteger(1.23678)).to.equal(124);
  });

  it('correctly converts a BTC price from a decimal to an integer', () => {
    expect(decimalToInteger(2.71, true)).to.equal(271000000);
  });

  // todo: test rounding of decimal to integer BTC price.
});
