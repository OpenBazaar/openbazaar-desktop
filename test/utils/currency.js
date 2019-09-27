import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import Polyglot from 'node-polyglot';
import bigNumber from 'bignumber.js';
import enUsTranslations from '../../js/languages/en_US.json';
import { walletCurs, walletCurDef } from '../walletCurData';
import { init as initWalletCurs } from '../../js/data/walletCurrencies';
import * as cur from '../../js/utils/currency';

// A string larger than JS can handle without precision loss
const strNumTooBig = '9007199254740992';

describe('the currency utility module', () => {
  before(function () {
    app.polyglot = new Polyglot();
    app.polyglot.extend(enUsTranslations);
    app.serverConfig = {
      ...(app.serverConfig || {}),
      wallets: walletCurs,
    };
    app.walletCurDef = walletCurDef;
  });

  it('correctly converts an amount as a number from an integer to decimal', () => {
    expect(cur.integerToDecimal(123, 2)).to.equal('1.23');
    expect(cur.integerToDecimal(123, 8)).to.equal('0.00000123');
    expect(cur.integerToDecimal(123, 18)).to.equal('1.23e-16');
    expect(cur.integerToDecimal(1.23, 18)).to.equal('1.23e-18');
  });

  it('correctly converts an amount as a string from an integer to decimal', () => {
    expect(cur.integerToDecimal('123', 2)).to.equal('1.23');
    expect(cur.integerToDecimal('123', 8)).to.equal('0.00000123');
    expect(cur.integerToDecimal('123', 18)).to.equal('1.23e-16');
    expect(cur.integerToDecimal('1.23', 18)).to.equal('1.23e-18');
  });

  it('correctly converts an amount as a number from a decimal to an integer', () => {
    expect(cur.decimalToInteger(1.23, 2)).to.equal('123');
    expect(cur.decimalToInteger(1.23, 8)).to.equal('123000000');
    expect(cur.decimalToInteger(1.23, 18)).to.equal('1230000000000000000');
  });

  it('correctly converts an amount as a string from a decimal to an integer', () => {
    expect(cur.decimalToInteger('1.23', 2)).to.equal('123');
    expect(cur.decimalToInteger('1.23', 8)).to.equal('123000000');
    expect(cur.decimalToInteger('1.23', 18)).to.equal('1230000000000000000');
  });

  it('correctly converts an amount from a decimal to an integer' +
    ' rounding to the correct place.', () => {
    expect(cur.decimalToInteger(1.2367832894, 2)).to.equal('124');
    expect(cur.decimalToInteger(1.2367832894, 8))
      .to
      .equal('123678329');
    expect(cur.decimalToInteger('1.2367832894239473246342349734', 18))
      .to
      .equal('1236783289423947325');
  });

  describe('has a minValueByCoinDiv function', () => {
    it('that correctly returns the minimum value for a given coin divisibility', () => {
      expect(cur.minValueByCoinDiv(2)).to.equal(0.01);
      expect(cur.minValueByCoinDiv(8)).to.equal(1e-8);
      expect(cur.minValueByCoinDiv(18)).to.equal(1e-18);
    });
  });

  describe('has functions that involve converting between currencies', () => {
    before(function () {
      sinon.stub($, 'ajax', () => {
        console.log('pickles');
        const deferred = $.Deferred();

        deferred.resolve({
          BTC: 1,
          PLN: 3148.48,
          USD: 750.6,
        });

        return deferred;
      });

      initWalletCurs(walletCurs, walletCurDef);
      cur.fetchExchangeRates();
    });

    describe('like convertCurrency', () => {
      it('which will convert between two fiat currencies', () => {
        // expect(cur.convertCurrency(500, 'USD', 'PLN'))
        //   .to
        //   .equal(2097.308819610978);
      });

      it('which will convert from a fiat currency to BTC', () => {
        // expect(cur.convertCurrency(500, 'USD', 'BTC'))
        //   .to
        //   .equal(0.6661337596589395);
      });

      it('which will convert from BTC to a fiat currency', () => {
        // expect(cur.convertCurrency(500, 'BTC', 'USD'))
        //   .to
        //   .equal(375300);
      });

      it('which correctly handles being called with the same' +
       'fiat currency for both the from and to currency', () => {
        // expect(cur.convertCurrency(500, 'USD', 'USD'))
        //   .to
        //   .equal(500);
      });

      it('which correctly handles being called with BTC as both' +
        'the from and to currency', () => {
        // expect(cur.convertCurrency(500, 'BTC', 'BTC'))
        //   .to
        //   .equal(500);
      });

      it('which when called with a string based amount, returns a string ' +
        'based amount', () => {
        // expect(cur.convertCurrency('500', 'USD', 'PLN'))
        //   .to
        //   .equal('2097.308819610977884344624');

        // expect(cur.convertCurrency('500', 'BTC', 'USD'))
        //   .to
        //   .equal('375300');

        // expect(cur.convertCurrency('500', 'USD', 'USD'))
        //   .to
        //   .equal('500');

        // expect(cur.convertCurrency('500', 'BTC', 'BTC'))
        //   .to
        //   .equal('500');
      });
    });

    describe('like convertAndFormatCurrency', () => {
      it('which will convert between two fiat currencies and properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PLN', { locale: 'en-US' }))
          .to
          .equal('PLN 2,097.31');
      });

      it('which will convert between a fiat currency and BTC and properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'BTC', { locale: 'en-US' }))
          .to
          .equal('₿0.66613376');
      });

      it('which will convert between BTC and a fiat currency properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'BTC', 'USD', { locale: 'en-US' }))
          .to
          .equal('$375,300.00');
      });

      it('which will properly handle string based amounts', () => {
        expect(cur.convertAndFormatCurrency('500', 'USD', 'PLN', { locale: 'en-US' }))
          .to
          .equal('PLN 2,097.31');

        expect(cur.convertAndFormatCurrency('500', 'USD', 'BTC', { locale: 'en-US' }))
          .to
          .equal('₿0.66613376');

        expect(cur.convertAndFormatCurrency('500', 'BTC', 'USD', { locale: 'en-US' }))
          .to
          .equal('$375,300.00');
      });
    });

    after(function () {
      $.ajax.restore();
    });
  });

  describe('has a function that formats a currency for display purposes', () => {
    const baseOpts = {
      locale: 'en-US',
      btcUnit: 'BTC',
      useCryptoSymbol: true,
      includeCryptoCurIdentifier: true,
      extendMaxDecimalsOnZero: true,
    };

    const cryptoOpts = {
      ...baseOpts,
      minDisplayDecimals: 0,
      maxDisplayDecimals: 8,
    };

    const fiatOpts = {
      ...baseOpts,
      minDisplayDecimals: 2,
      maxDisplayDecimals: 2,
    };

    it('properly formats a currency when passing in an amount as a number', () => {
      expect(cur.formatCurrency(123.4567891234, 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678912');

      expect(cur.formatCurrency(123.4567891294, 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678913');

      expect(cur.formatCurrency(5.12345, 'BTC', cryptoOpts))
        .to
        .equal('₿5.12345');

      expect(cur.formatCurrency(123.4567891234, 'USD', fiatOpts))
        .to
        .equal('$123.46');

      expect(cur.formatCurrency(123.4527891294, 'USD', fiatOpts))
        .to
        .equal('$123.45');
    });

    it('properly formats a currency when passing in an amount as a string', () => {
      expect(cur.formatCurrency('123.4567891234', 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678912');

      expect(cur.formatCurrency('123.4567891294', 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678913');

      expect(cur.formatCurrency('123.4567891234', 'USD', fiatOpts))
        .to
        .equal('$123.46');

      expect(cur.formatCurrency('123.4527891294', 'USD', fiatOpts))
        .to
        .equal('$123.45');
    });

    it('properly formats a currency when passing in an amount as a BigNuber instance', () => {
      expect(cur.formatCurrency(bigNumber('123.4567891234'), 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678912');

      expect(cur.formatCurrency(bigNumber('123.4567891294'), 'BTC', cryptoOpts))
        .to
        .equal('₿123.45678913');

      expect(cur.formatCurrency(bigNumber('123.4567891234'), 'USD', fiatOpts))
        .to
        .equal('$123.46');

      expect(cur.formatCurrency(bigNumber('123.4527891294'), 'USD', fiatOpts))
        .to
        .equal('$123.45');
    });

    it('handles numbers that are beyond the support of Intl.NumberFormat', () => {
      expect(cur.formatCurrency(strNumTooBig, 'BTC', {
        ...cryptoOpts,
        locale: 'pl-PL',
      }))
        .to
        .equal('₿9,007,199,254,740,992');

      expect(cur.formatCurrency(`0.${strNumTooBig}`, 'BTC', {
        ...cryptoOpts,
        locale: 'pl-PL',
      }))
        .to
        .equal('₿0.90071993');

      expect(cur.formatCurrency(`0.${strNumTooBig}94184`, 'BTC', {
        ...cryptoOpts,
        maxDisplayDecimals: 20,
      }))
        .to
        .equal('₿0.90071992547409929418');

      expect(cur.formatCurrency(`0.${strNumTooBig}94185`, 'BTC', {
        ...cryptoOpts,
        maxDisplayDecimals: 20,
      }))
        .to
        .equal('₿0.90071992547409929419');
    });

    it('handles alternate BTC units', () => {
      expect(cur.formatCurrency(`0.${strNumTooBig}94185`, 'BTC', {
        ...cryptoOpts,
        maxDisplayDecimals: 20,
        btcUnit: 'UBTC',
      }))
        .to
        .equal('900,719.925474099294185 μBTC');

      expect(cur.formatCurrency(5.12345, 'BTC', {
        ...cryptoOpts,
        btcUnit: 'UBTC',
      }))
        .to
        .equal('5,123,450 μBTC');

      expect(cur.formatCurrency(`0.${strNumTooBig}94185`, 'BTC', {
        ...cryptoOpts,
        maxDisplayDecimals: 20,
        btcUnit: 'MBTC',
      }))
        .to
        .equal('900.719925474099294185 mBTC');

      expect(cur.formatCurrency(5.12345, 'BTC', {
        ...cryptoOpts,
        btcUnit: 'MBTC',
      }))
        .to
        .equal('5,123.45 mBTC');

      expect(cur.formatCurrency(`0.${strNumTooBig}94185`, 'BTC', {
        ...cryptoOpts,
        maxDisplayDecimals: 20,
        btcUnit: 'SATOSHI',
      }))
        .to
        .equal('90,071,992.5474099294185 sat');

      expect(cur.formatCurrency(5.12345, 'BTC', {
        ...cryptoOpts,
        btcUnit: 'SATOSHI',
      }))
        .to
        .equal('512,345,000 sat');
    });
  });

  it('has a function to create an amount object that includes a currency ' +
    'definition', () => {
    expect(cur.decimalToCurDef(23.12, 'USD'))
      .to
      .deep
      .equal({
        amount: '2312',
        currency: {
          code: 'USD',
          divisibility: 2,
        },
      });

    expect(cur.decimalToCurDef('23.12', 'USD'))
      .to
      .deep
      .equal({
        amount: '2312',
        currency: {
          code: 'USD',
          divisibility: 2,
        },
      });

    expect(cur.decimalToCurDef(strNumTooBig, 'BTC', {
      divisibility: 4,
    }))
      .to
      .deep
      .equal({
        amount: '90071992547409920000',
        currency: {
          code: 'BTC',
          divisibility: 4,
        },
      });
  });

  describe('has function that let\'s you know whether a given amount exceeds the  ' +
    'range supported by the native Intl.NumberFormat function and', () => {
    it('it returns true for supported numbers', () => {
      // can handle "number" numbers
      expect(
        cur.nativeNumberFormatSupported(Number.MAX_SAFE_INTEGER, 20)
      ).to.equal(true);

      expect(
        cur.nativeNumberFormatSupported(Number(`0.${Number.MAX_SAFE_INTEGER}`), 20)
      ).to.equal(true);

      expect(
        cur.nativeNumberFormatSupported(123.456789, 20)
      ).to.equal(true);

      // can handle string based numbers
      expect(
        cur.nativeNumberFormatSupported(String(Number.MAX_SAFE_INTEGER), 20)
      ).to.equal(true);

      // can handle BigNumber instances
      expect(
        cur.nativeNumberFormatSupported(bigNumber(Number.MAX_SAFE_INTEGER), 20)
      ).to.equal(true);
    });

    it('it returns false for supported numbers', () => {
      // can handle "number" numbers
      expect(
        cur.nativeNumberFormatSupported(12345.678911234567, 20)
      ).to.equal(false);

      // can handle string based numbers
      expect(
        cur.nativeNumberFormatSupported(strNumTooBig, 20)
      ).to.equal(false);

      expect(
        cur.nativeNumberFormatSupported(`0.${strNumTooBig}`, 20)
      ).to.equal(false);

      expect(
        cur.nativeNumberFormatSupported('12345.678911234567', 20)
      ).to.equal(false);

      // can handle BigNumber instances
      expect(
        cur.nativeNumberFormatSupported(bigNumber(strNumTooBig), 20)
      ).to.equal(false);
    });
  });
});
