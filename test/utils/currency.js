import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import * as cur from '../../js/utils/currency';

const translations = {
  bitcoinCurrencyUnits: {
    BTC: 'BTC',
    MBTC: 'mBTC',
    UBTC: 'µBTC',
    SATOSHI: 'sat',
  },
};

describe('the currency utility module', () => {
  before(function () {
    app.polyglot = {
      t: (str) => {
        let retStr = '';

        if (str.startsWith('bitcoinCurrencyUnits')) {
          const btcUnit = str.split('.')[1];
          retStr = translations.bitcoinCurrencyUnits[btcUnit];
        }

        return retStr;
      },
    };
  });

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

  it('correctly formats a BTC price up to 8 decimal places without any insignificant zeros', () => {
    expect(cur.formatPrice(2.713546, true)).to.equal('2.713546');
    expect(cur.formatPrice(2.718925729, true)).to.equal('2.71892573');
    expect(cur.formatPrice(2, true)).to.equal('2');
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
        .equal('฿523');

      expect(cur.formatCurrency(523.987, 'BTC', 'en-US'))
        .to
        .equal('฿523.987');

      expect(cur.formatCurrency(523.12, 'BTC', 'en-US'))
        .to
        .equal('฿523.12');
      expect(cur.formatCurrency(523.12345678, 'BTC', 'en-US'))
        .to
        .equal('฿523.12345678');
    });

    it('properly localizes a BTC amount with the correct bitcoin units', () => {
      expect(cur.formatCurrency(523.3456, 'BTC', 'en-US', 'BTC'))
        .to
        .equal('฿523.3456');

      expect(cur.formatCurrency(523.3456, 'BTC', 'en-US', 'MBTC'))
        .to
        .equal(`${translations.bitcoinCurrencyUnits.MBTC}523,345.6`);

      expect(cur.formatCurrency(523.3456, 'BTC', 'en-US', 'UBTC'))
        .to
        .equal(`${translations.bitcoinCurrencyUnits.UBTC}523,345,600`);
      expect(cur.formatCurrency(523.3456, 'BTC', 'en-US', 'SATOSHI'))
        .to
        .equal(`${translations.bitcoinCurrencyUnits.SATOSHI}52,334,560,000`);
    });
  });

  describe('has functions that involve converting between currencies', () => {
    let ajax;

    before(function () {
      ajax = sinon.stub($, 'ajax', () => {
        const deferred = $.Deferred();

        deferred.resolve({
          // The api is actually returning a non 1 for the bitcoin value, which seems
          // like a bug, but it will allow us to test that if we call our conversion
          // functions to convert from or to BTC, it will ignore that BTC exchange rate
          // and use an implied 1.
          BTC: 1.02,
          PLN: 3148.48,
          USD: 750.6,
        });

        return deferred.promise();
      });

      cur.fetchExchangeRates();
    });

    describe('like convertCurrency', () => {
      it('which will convert between two fiat currencies', () => {
        expect(cur.convertCurrency(500, 'USD', 'PLN'))
          .to
          .equal(2097.308819610978);
      });

      it('which will convert from a fiat currency to BTC', () => {
        expect(cur.convertCurrency(500, 'USD', 'BTC'))
          .to
          .equal(0.6661337596589395);
      });

      it('which will convert from BTC to a fiat currency', () => {
        expect(cur.convertCurrency(500, 'BTC', 'USD'))
          .to
          .equal(375300);
      });

      it('which correctly handles being called with the same' +
       'fiat currency for both the from and to currency', () => {
        expect(cur.convertCurrency(500, 'USD', 'USD'))
          .to
          .equal(500);
      });

      it('which correctly handles being called with BTC as both' +
        'the from and to currency', () => {
        expect(cur.convertCurrency(500, 'BTC', 'BTC'))
          .to
          .equal(500);
      });
    });

    describe('like convertAndFormatCurrency', () => {
      it('which will convert between two fiat currencies properly localize' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PLN', { locale: 'en-US' }))
          .to
          .equal('PLN2,097.31');
      });

      it('which will convert between a fiat currency and BTC and properly localize' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'BTC', { locale: 'en-US' }))
          .to
          .equal('฿0.66613376');
      });

      it('which will convert between BTC and a fiat currency properly localize' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'BTC', 'USD', { locale: 'en-US' }))
          .to
          .equal('$375,300.00');
      });
    });

    after(function () {
      ajax.restore();
    });
  });
});
