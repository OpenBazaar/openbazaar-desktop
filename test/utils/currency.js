import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as cur from '../../js/utils/currency';

describe('the currency utility module', () => {
  it('correctly converts a fiat amount from an integer to decimal', () => {
    expect(cur.integerToDecimal(123)).to.equal(1.23);
  });

  it('correctly converts a BTC price from an integer to a decimal', () => {
    expect(cur.integerToDecimal(271453590, true)).to.equal(2.71453590);
  });

  it('correctly converts a fiat amount from a decimal to an integer', () => {
    expect(cur.decimalToInteger(1.23)).to.equal(123);
  });

  it('correctly converts a fiat amount from a decimal to an integer' +
    ' rounding to the hundreds place.', () => {
    expect(cur.decimalToInteger(1.23678)).to.equal(124);
  });

  it('correctly converts a BTC price from a decimal to an integer', () => {
    expect(cur.decimalToInteger(2.71, true)).to.equal(271000000);
  });

  it('correctly formats a non-BTC price to 2 decimal place', () => {
    expect(cur.formatPrice(2.713546, false)).to.equal('2.71');
    expect(cur.formatPrice(2.7189, false)).to.equal('2.72');
    expect(cur.formatPrice(2, false)).to.equal('2.00');
  });

  it('correctly formats a BTC price to 8 decimal place', () => {
    expect(cur.formatPrice(2.713546, true)).to.equal('2.71354600');
    expect(cur.formatPrice(2.718925729, true)).to.equal('2.71892573');
    expect(cur.formatPrice(2, true)).to.equal('2.00000000');
  });

  describe('has a function to localize currency (formatCurrency) that', () => {
    it('throws an error if you don\'t provide an amount as a number', () => {
      let errorThrown = false;

      try {
        cur.formatCurrency('500.23', 'USD', 'en-US');
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);

      errorThrown = false;

      try {
        cur.formatCurrency(NaN, 'USD', 'en-US');
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
    });

    it('throws an error if a currency is not provided as a string', () => {
      let errorThrown = false;

      try {
        cur.formatCurrency(500, 5, 'en-US');
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);

      errorThrown = false;

      try {
        cur.formatCurrency(500, null, 'en-US');
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);

      try {
        cur.formatCurrency(500, false, 'en-US');
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
    });

    it('throws an error if a locale is provided as something other than a string',
      () => {
        let errorThrown = false;

        try {
          cur.formatCurrency(500, 'USD', 99);
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);

        errorThrown = false;

        try {
          cur.formatCurrency(500, 'USD', null);
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);

        try {
          cur.formatCurrency(500, 'USD', false);
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);
      });

    it('properly localizes a fiat amount', () => {
      expect(cur.formatCurrency(523, 'USD', 'en-US'))
        .to
        .equal('$523.00');

      expect(cur.formatCurrency(523.987, 'USD', 'en-US'))
        .to
        .equal('$523.99');

      expect(cur.formatCurrency(523.12, 'USD', 'en-US'))
        .to
        .equal('$523.12');
    });

    it('properly localizes a BTC amount', () => {
      expect(cur.formatCurrency(523, 'BTC', 'en-US'))
        .to
        .equal('฿523.00000000');

      expect(cur.formatCurrency(523.987, 'BTC', 'en-US'))
        .to
        .equal('฿523.98700000');

      expect(cur.formatCurrency(523.12, 'BTC', 'en-US'))
        .to
        .equal('฿523.12000000');
    });
  });
});
