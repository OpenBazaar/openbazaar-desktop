import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import Polyglot from 'node-polyglot';
import enUsTranslations from '../../js/languages/en_US.json';
import * as cur from '../../js/utils/currency';

describe('the currency utility module', () => {
  before(function () {
    app.polyglot = new Polyglot();
    app.polyglot.extend(enUsTranslations);
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
          cur.formatCurrency(500, 'USD', {
            locale: 99,
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);

        errorThrown = false;

        try {
          cur.formatCurrency(500, 'USD', {
            locale: null,
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);

        try {
          cur.formatCurrency(500, 'USD', {
            locale: false,
          });
        } catch (e) {
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);
      });

    it('properly localizes a fiat amount', () => {
      expect(cur.formatCurrency(523, 'USD'))
        .to
        .equal('$523.00');

      expect(cur.formatCurrency(523.987, 'USD'))
        .to
        .equal('$523.99');

      expect(cur.formatCurrency(523.12, 'USD'))
        .to
        .equal('$523.12');
    });

    it('properly localizes a BTC amount', () => {
      expect(cur.formatCurrency(523, 'PHR'))
        .to
        .equal('523 PHR');

      expect(cur.formatCurrency(523.987, 'PHR'))
        .to
        .equal('523.987 PHR');

      expect(cur.formatCurrency(523.12, 'PHR'))
        .to
        .equal('523.12 PHR');
      expect(cur.formatCurrency(523.12345678, 'PHR'))
        .to
        .equal('523.12345678 PHR');
    });

    it('properly localizes a BTC amount with the correct bitcoin units', () => {
      expect(cur.formatCurrency(523.3456, 'PHR', {
        btcUnit: 'PHR',
      })).to
        .equal('523.3456 PHR');

      expect(cur.formatCurrency(523.3456, 'PHR', {
        btcUnit: 'mPHR',
      })).to
        .equal(`523,345.6 ${app.polyglot.phrases['bitcoinCurrencyUnits.mPHR']}`);

      expect(cur.formatCurrency(523.3456, 'PHR', {
        btcUnit: 'uPHR',
      })).to
        .equal(`523,345,600 ${app.polyglot.phrases['bitcoinCurrencyUnits.uPHR']}`);

      expect(cur.formatCurrency(523.3456, 'PHR', {
        btcUnit: 'pSAT',
      })).to
        .equal(`52,334,560,000 ${app.polyglot.phrases['bitcoinCurrencyUnits.pSAT']}`);
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
          PHR: 1.02,
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
        expect(cur.convertCurrency(500, 'USD', 'PHR'))
          .to
          .equal(0.6661337596589395);
      });

      it('which will convert from BTC to a fiat currency', () => {
        expect(cur.convertCurrency(500, 'PHR', 'USD'))
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
        expect(cur.convertCurrency(500, 'PHR', 'PHR'))
          .to
          .equal(500);
      });
    });

    describe('like convertAndFormatCurrency', () => {
      it('which will convert between two fiat currencies properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PLN', { locale: 'en-US' }))
          .to
          .equal('PLN2,097.31');
      });

      it('which will convert between a fiat currency and BTC and properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PHR', { locale: 'en-US' }))
          .to
          .equal('0.66613376 PHR');
      });

      it('which will convert between BTC and a fiat currency properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'PHR', 'USD', { locale: 'en-US' }))
          .to
          .equal('$375,300.00');
      });
    });

    after(function () {
      ajax.restore();
    });
  });
});
