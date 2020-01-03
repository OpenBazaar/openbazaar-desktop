import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import Polyglot from 'node-polyglot';
import bigNumber from 'bignumber.js';
import enUsTranslations from '../../js/languages/en_US.json';
import * as cur from '../../js/utils/currency';

// A string larger than JS can handle without precision loss
const strNumTooBig = '9007199254740992';

describe('the currency utility module', () => {
  before(function () {
    app.polyglot = new Polyglot();
    app.polyglot.extend(enUsTranslations);
  });

  describe('has a integer to decimal function', () => {
    it('that correctly converts an amount as a number from an integer to ' +
      'a decimal', () => {
      expect(
        cur
          .integerToDecimal(123, 2)
          .toString()
      ).to.equal('1.23');

      expect(
        cur
          .integerToDecimal(123, 8)
          .toString()
      ).to.equal('0.00000123');

      expect(
        cur
          .integerToDecimal(123, 18)
          .toString()
      ).to.equal('1.23e-16');
    });

    it('that when converting an integer to a decimal, if an error occurs, returns a '
      + 'BigNumber NaN instance if returnNaNOnError is set to true', () => {
      expect(
        (
          cur
            .integerToDecimal(bigNumber('123'), 'howdy', { returnNaNOnError: true })
        ).isNaN()
      ).to.equal(true);

      expect(
        (
          cur
            .integerToDecimal('pluto factory', 2, { returnNaNOnError: true })
        ).isNaN()
      ).to.equal(true);
    });

    it('correctly converts an amount as a number from a decimal to an integer', () => {
      expect(
        cur
          .decimalToInteger(1.23, 2)
          .toString()
      ).to.equal('123');

      expect(
        cur
          .decimalToInteger(1.23, 8)
          .toString()
      ).to.equal('123000000');

      expect(
        cur
          .integerToDecimal(1.23, 18)
          .toString()
      ).to.equal('1.23e-18');
    });

    it('that correctly converts an amount as a string from an integer ' +
      'to a decimal', () => {
      expect(
        cur
          .integerToDecimal('123', 2)
          .toString()
      ).to.equal('1.23');

      expect(
        cur
          .integerToDecimal('123', 8)
          .toString()
      ).to.equal('0.00000123');

      expect(
        cur
          .integerToDecimal('123', 18)
          .toString()
      ).to.equal('1.23e-16');

      expect(
        cur
          .integerToDecimal('1.23', 18)
          .toString()
      ).to.equal('1.23e-18');
    });

    it('that correctly converts an amount as a BigNumber instance from an integer ' +
      'to a decimal', () => {
      expect(
        cur
          .integerToDecimal(bigNumber('123'), 2)
          .toString()
      ).to.equal('1.23');

      expect(
        cur
          .integerToDecimal(bigNumber('123'), 8)
          .toString()
      ).to.equal('0.00000123');

      expect(
        cur
          .integerToDecimal(bigNumber('123'), 18)
          .toString()
      ).to.equal('1.23e-16');

      expect(
        cur
          .integerToDecimal(bigNumber('1.23'), 18)
          .toString()
      ).to.equal('1.23e-18');
    });

    it('that returns a BigNumber NaN instance on error if the returnNaNOnError ' +
      'option is true', () => {
      expect(
        cur
          .integerToDecimal(null, 2, { returnNaNOnError: true })
          .isNaN()
      ).to.equal(true);

      expect(
        cur
          .integerToDecimal(bigNumber('23'), 'chocolaty', { returnNaNOnError: true })
          .isNaN()
      ).to.equal(true);

      let exceptionThrown = false;

      try {
        cur
          .integerToDecimal(bigNumber('23'), 'chocolaty', { returnNaNOnError: false });
      } catch (e) {
        exceptionThrown = true;
      }

      expect(exceptionThrown).to.equal(true);
    });
  });

  describe('has a decimal to integer function', () => {
    it('that correctly converts an amount as a number from a decimal to an integer',
      () => {
        expect(
          cur
            .decimalToInteger(1.23, 2)
            .toString()
        ).to.equal('123');

        expect(
          cur
            .decimalToInteger(1.23, 8)
            .toString()
        ).to.equal('123000000');

        expect(
          cur
            .decimalToInteger(1.23, 18)
            .toString()
        ).to.equal('1230000000000000000');
      });

    it('correctly converts an amount as a string from a decimal to an integer', () => {
      expect(
        cur
          .decimalToInteger('1.23', 2)
          .toString()
      ).to.equal('123');

      expect(
        cur
          .decimalToInteger('1.23', 8)
          .toString()
      ).to.equal('123000000');

      expect(
        cur
          .decimalToInteger('1.23', 18)
          .toString()
      ).to.equal('1230000000000000000');
    });

    it('correctly converts an amount as a BigNumber instance from a decimal to an ' +
      'integer', () => {
      expect(
        cur
          .decimalToInteger(bigNumber('1.23'), 2)
          .toString()
      ).to.equal('123');

      expect(
        cur
          .decimalToInteger(bigNumber('1.23'), 8)
          .toString()
      ).to.equal('123000000');

      expect(
        cur
          .decimalToInteger(bigNumber('1.23'), 18)
          .toString()
      ).to.equal('1230000000000000000');
    });

    it('correctly converts an amount from a decimal to an integer' +
      ' rounding to the correct place.', () => {
      expect(
        cur
          .decimalToInteger(1.2367832894, 2)
          .toString()
      ).to.equal('124');

      expect(
        cur
          .decimalToInteger(1.2367832894, 8)
          .toString()
      )
        .to
        .equal('123678329');

      expect(
        cur
          .decimalToInteger('1.2367832894239473246342349734', 18)
          .toString()
      )
        .to
        .equal('1236783289423947325');
    });

    it('that returns a BigNumber NaN instance on error if the returnNaNOnError ' +
      'option is true', () => {
      expect(
        cur
          .decimalToInteger('chickpea stew', 2, { returnNaNOnError: true })
          .isNaN()
      ).to.equal(true);

      expect(
        cur
          .decimalToInteger(23, 'chocolaty salamanca', { returnNaNOnError: true })
          .isNaN()
      ).to.equal(true);

      let exceptionThrown = false;

      try {
        cur
          .integerToDecimal(23, 'chocolaty salamanca', { returnNaNOnError: false });
      } catch (e) {
        exceptionThrown = true;
      }

      expect(exceptionThrown).to.equal(true);
    });
  });

  describe('has a decimalToCurDef function', () => {
    it('that correctly converts a decimal number as a number to a currency definition ' +
      'object', () => {
      let curDef = cur.decimalToCurDef(10, 'USD');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000',
          currency: {
            code: 'USD',
            divisibility: 2,
          },
        });

      curDef = cur.decimalToCurDef(10, 'BTC');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000000000',
          currency: {
            code: 'BTC',
            divisibility: 8,
          },
        });
    });

    it('that correctly converts a decimal number as a string to a currency definition ' +
      'object', () => {
      let curDef = cur.decimalToCurDef('10', 'USD');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000',
          currency: {
            code: 'USD',
            divisibility: 2,
          },
        });

      curDef = cur.decimalToCurDef('10', 'BTC');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000000000',
          currency: {
            code: 'BTC',
            divisibility: 8,
          },
        });
    });


    it('that correctly converts a decimal number as a BigNumber instance to a currency ' +
      'definition object', () => {
      let curDef = cur.decimalToCurDef(bigNumber('10'), 'USD');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000',
          currency: {
            code: 'USD',
            divisibility: 2,
          },
        });

      curDef = cur.decimalToCurDef(bigNumber('10'), 'BTC');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount: '1000000000',
          currency: {
            code: 'BTC',
            divisibility: 8,
          },
        });
    });

    it('that correctly handles numbers that are beyond JavaScript\'s native capabilities as long ' +
      'as the number is provided as a string or BigNumber instance.', () => {
      let curDef = cur.decimalToCurDef(strNumTooBig, 'BTC');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount:
            (
              bigNumber(strNumTooBig)
                .times(100000000)
            ).toString(),
          currency: {
            code: 'BTC',
            divisibility: 8,
          },
        });

      curDef = cur.decimalToCurDef(bigNumber('9.000000000000000001'), 'ETH');
      curDef.amount = curDef.amount.toString();
      expect(curDef)
        .to.deep.equal({
          amount:
            (
              bigNumber('9.000000000000000001')
                .times('1000000000000000000')
            ).toString(),
          currency: {
            code: 'ETH',
            divisibility: 18,
          },
        });
    });
  });

  describe('has a curDefToDecimal function', () => {
    it('that correctly converts a currency definition to a BigNumber instance ' +
      'representing a converted decimal number', () => {
      let result = (
        cur.curDefToDecimal({
          currency: {
            code: 'USD',
            divisibility: 2,
          },
          amount: '100',
        })
      ).toString();
      expect(result).to.equal('1');

      result = (
        cur.curDefToDecimal({
          currency: {
            code: 'BTC',
            divisibility: 8,
          },
          amount: '100',
        })
      ).toString();
      expect(result).to.equal('0.000001');

      result = (
        cur.curDefToDecimal({
          currency: {
            code: 'ETH',
            divisibility: 18,
          },
          amount: '100',
        })
      ).toString();
      expect(result).to.equal('1e-16');
    });

    it('that correctly handles numbers that are beyond JavaScript\'s native number '
      + 'capabilities.', () => {
      let result = (
        cur.curDefToDecimal({
          currency: {
            code: 'USD',
            divisibility: 2,
          },
          amount: strNumTooBig,
        })
      ).toString();
      expect(result).to.equal('90071992547409.92');

      result = (
        cur.curDefToDecimal({
          currency: {
            code: 'DONT_MATTAH',
            divisibility: 20,
          },
          amount: strNumTooBig,
        })
      ).toString();
      expect(result).to.equal('0.00009007199254740992');

      result = (
        cur.curDefToDecimal({
          currency: {
            code: 'DONT_MATTAH',
            divisibility: 20,
          },
          amount: `0.00000${strNumTooBig}`,
        })
      ).toString();
      expect(result).to.equal('9.007199254740992e-26');
    });
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
        const deferred = $.Deferred();

        deferred.resolve({
          BTC: 1,
          PLN: 3148.48,
          USD: 750.6,
        });

        return deferred;
      });

      cur.fetchExchangeRates();
    });

    describe('like convertCurrency', () => {
      it('which will convert between two fiat currencies', () => {
        expect(cur.convertCurrency(500, 'USD', 'PLN'))
          .to
          .equal(2097.3088196109775);
      });

      it('which will convert from a fiat currency to BTC', () => {
        expect(cur.convertCurrency(500, 'USD', 'BTC'))
          .to
          .equal(0.6661337596589394);
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

      it('which when called with a string based amount, returns a string ' +
        'based amount', () => {
        expect(cur.convertCurrency('500', 'USD', 'PLN'))
          .to
          .equal('2097.3088196109775');

        expect(cur.convertCurrency('500', 'BTC', 'USD'))
          .to
          .equal('375300');

        expect(cur.convertCurrency('500', 'USD', 'USD'))
          .to
          .equal('500');

        expect(cur.convertCurrency('500', 'BTC', 'BTC'))
          .to
          .equal('500');
      });

      it('which when called with a BigNumber instance, returns a BigNumber ' +
        'instance', () => {
        expect(
          (
            cur.convertCurrency(bigNumber(strNumTooBig), 'USD', 'PLN'))
            .toString()
          )
          .to
          .equal('37781756873923412.33014392487936');

        expect(
          (
            cur.convertCurrency(bigNumber('500'), 'USD', 'USD'))
            .toString()
          )
          .to
          .equal('500');
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

  describe('has function that let\'s you know whether a given amount exceeds the ' +
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

  describe('has a function that validates a currency amount', () => {
    it('checks for a valid divisibility', () => {
      expect(
        cur
          .validateCurrencyAmount('100', 8)
          .validCoinDiv
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount('100', 'howdy')
          .validCoinDiv
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('100', null)
          .validCoinDiv
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('100', '8')
          .validCoinDiv
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('100')
          .validCoinDiv
      ).to.equal(false);
    });

    it('checks whether you provide an amount', () => {
      expect(
        cur
          .validateCurrencyAmount('100', 8)
          .validRequired
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount()
          .validRequired
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount(null, 8)
          .validRequired
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('', 8)
          .validRequired
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount(undefined, 8)
          .validRequired
      ).to.equal(false);
    });

    it('checks whether the amount is provided in the correct type', () => {
      expect(
        cur
          .validateCurrencyAmount(8, 8, { requireBigNumAmount: false })
          .validType
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount('8', 8, { requireBigNumAmount: false })
          .validType
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(bigNumber('8'), 8, { requireBigNumAmount: false })
          .validType
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount('pickles', 8, { requireBigNumAmount: false })
          .validType
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount(bigNumber('8'), 8, { requireBigNumAmount: true })
          .validType
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(8, 8, { requireBigNumAmount: true })
          .validType
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('8', 8, { requireBigNumAmount: true })
          .validType
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount('chowdah', 8, { requireBigNumAmount: true })
          .validType
      ).to.equal(false);
    });

    it('validates the amount falls within the correct range', () => {
      expect(
        cur
          .validateCurrencyAmount(bigNumber(0), 8,
          {
            rangeType: cur
              .CUR_VAL_RANGE_TYPES
              .GREATER_THAN_ZERO,
          }
        )
          .validRange
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount(bigNumber(1), 8,
          {
            rangeType: cur
              .CUR_VAL_RANGE_TYPES
              .GREATER_THAN_ZERO,
          }
        )
          .validRange
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(bigNumber(0), 8,
          {
            rangeType: cur
              .CUR_VAL_RANGE_TYPES
              .GREATER_THAN_OR_EQUAL_ZERO,
          }
        )
          .validRange
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(bigNumber(-2), 8,
          {
            rangeType: cur
              .CUR_VAL_RANGE_TYPES
              .GREATER_THAN_OR_EQUAL_ZERO,
          }
        )
          .validRange
      ).to.equal(false);
    });

    it('validates the amount does not exceed the maximum supported fraction digits ' +
      'the provided divisibility supports', () => {
      expect(
        cur
          .validateCurrencyAmount(1.00000001, 8, { requireBigNumAmount: false })
          .validFractionDigitCount
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(1.000000001, 8, { requireBigNumAmount: false })
          .validFractionDigitCount
      ).to.equal(false);

      expect(
        cur
          .validateCurrencyAmount(1.01, 2, { requireBigNumAmount: false })
          .validFractionDigitCount
      ).to.equal(true);

      expect(
        cur
          .validateCurrencyAmount(1.009, 2, { requireBigNumAmount: false })
          .validFractionDigitCount
      ).to.equal(false);
    });
  });
});

