import { expect } from 'chai';
import { describe, it } from 'mocha';
import { decimalToInteger, integerToDecimal, formatPrice } from '../../js/utils/currency';

describe('the currency utility module', () => {
  it('correctly converts a fiat amount from an integer to decimal', () => {
    expect(integerToDecimal(123)).to.equal(1.23);
  });

  it('correctly converts a BTC price from an integer to a decimal', () => {
    expect(integerToDecimal(271453590, true)).to.equal(2.71453590);
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

  it('correctly formats a non-BTC price to 2 decimal place', () => {
    expect(formatPrice(2.713546, false)).to.equal('2.71');
    expect(formatPrice(2.7189, false)).to.equal('2.72');
    expect(formatPrice(2, false)).to.equal('2.00');
  });

  it('correctly formats a BTC price to 8 decimal place', () => {
    expect(formatPrice(2.713546, true)).to.equal('2.71354600');
    expect(formatPrice(2.718925729, true)).to.equal('2.71892573');
    expect(formatPrice(2, true)).to.equal('2.00000000');
  });
});
