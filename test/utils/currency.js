import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import Polyglot from 'node-polyglot';
import enUsTranslations from '../../js/languages/en_US.json';
import { walletCurs, walletCurDef } from '../walletCurData';
import { init as initWalletCurs } from '../../js/data/walletCurrencies';
import * as cur from '../../js/utils/currency';

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

    it('that will return the result in standard notation if a returnInStandardNotation ' +
      'of true is passed in', () => {
      expect(cur.minValueByCoinDiv(2, { returnInStandardNotation: true }))
        .to
        .equal('0.01');

      expect(cur.minValueByCoinDiv(8, { returnInStandardNotation: true }))
        .to
        .equal('0.00000001');

      expect(cur.minValueByCoinDiv(18, { returnInStandardNotation: true }))
        .to
        .equal('0.000000000000000001');
    });
  });

  // describe('has a isFormattedResultZero function', () => {
  //   it('that correctly lets you know if an amount provided as a number would result in zero ' +
  //     'if formatted with the given maxDecimals',
  //     () => {
  //       expect(cur.isFormattedResultZero(19, 2))
  //         .to
  //         .equal(false);

  //       expect(cur.isFormattedResultZero(1.000001, 2))
  //         .to
  //         .equal(false);

  //       expect(cur.isFormattedResultZero(0.001, 2))
  //         .to
  //         .equal(true);

  //       expect(cur.isFormattedResultZero(0.005, 2))
  //         .to
  //         .equal(false);

  //       expect(cur.isFormattedResultZero(0.000000000000000001, 18))
  //         .to
  //         .equal(false);

  //       expect(cur.isFormattedResultZero(0.0000000000000000001, 18))
  //         .to
  //         .equal(true);

  //       expect(cur.isFormattedResultZero(1.0000000000000000001, 18))
  //         .to
  //         .equal(false);

  //       expect(cur.isFormattedResultZero(0.0000000000000000005, 18))
  //         .to
  //         .equal(false);
  //     });

  //   it('that correctly lets you know if an amount provided as a string would result in zero ' +
  //       'if formatted with the given maxDecimals',
  //       () => {
  //         expect(cur.isFormattedResultZero('19', 2))
  //           .to
  //           .equal(false);

  //         expect(cur.isFormattedResultZero('1.000001', 2))
  //           .to
  //           .equal(false);

  //         expect(cur.isFormattedResultZero('0.001', 2))
  //           .to
  //           .equal(true);

  //         expect(cur.isFormattedResultZero('0.005', 2))
  //           .to
  //           .equal(false);

  //         expect(cur.isFormattedResultZero('0.000000000000000001', 18))
  //           .to
  //           .equal(false);

  //         expect(cur.isFormattedResultZero('0.0000000000000000001', 18))
  //           .to
  //           .equal(true);

  //         expect(cur.isFormattedResultZero('1.0000000000000000001', 18))
  //           .to
  //           .equal(false);

  //         expect(cur.isFormattedResultZero('0.0000000000000000005', 18))
  //           .to
  //           .equal(false);
  //       });
  // });

  // describe('has a getMaxDisplayDigits', () => {
  //   it('that returns the provided desiredMax if the resulting formatted ' +
  //     'number would not be zero', () => {
  //     expect(cur.getMaxDisplayDigits(0.0001, 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits(0.00016754, 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits(0.00010000, 4))
  //       .to
  //       .equal(4);

  //     // supports both a string and numeric amount
  //     expect(cur.getMaxDisplayDigits('0.0001', 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits('0.00016754', 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits('0.00010000', 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits('0.00010000', 4))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits('0.0001', 8))
  //       .to
  //       .equal(8);
  //   });

  //   it('returns the number of decimal places required to show the first ' +
  //     'significant digit', () => {
  //     expect(cur.getMaxDisplayDigits(0.00001, 4))
  //       .to
  //       .equal(5);

  //     expect(cur.getMaxDisplayDigits(0.00016754, 2))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits(0.0005, 3))
  //       .to
  //       .equal(3);

  //     expect(cur.getMaxDisplayDigits(0.0004, 3))
  //       .to
  //       .equal(4);

  //     // supports both a string and numeric amount
  //     expect(cur.getMaxDisplayDigits('0.00001', 4))
  //       .to
  //       .equal(5);

  //     expect(cur.getMaxDisplayDigits('0.00016754', 2))
  //       .to
  //       .equal(4);

  //     expect(cur.getMaxDisplayDigits('0.0005', 3))
  //       .to
  //       .equal(3);

  //     expect(cur.getMaxDisplayDigits('0.0004', 3))
  //       .to
  //       .equal(4);
  //   });
  // });

  describe('has functions that involve converting between currencies', () => {
    let ajax;

    before(function () {
      ajax = sinon.stub($, 'ajax', () => {
        const deferred = $.Deferred();

        deferred.resolve({
          BTC: 1,
          PLN: 3148.48,
          USD: 750.6,
        });

        return deferred.promise();
      });

      initWalletCurs(walletCurs, walletCurDef);
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
    });

    after(function () {
      ajax.restore();
    });
  });
});
