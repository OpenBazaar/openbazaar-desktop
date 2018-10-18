import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import sinon from 'sinon';
import * as walletCurMod from '../../../js/data/walletCurrencies';
import Metadata from '../../../js/models/listing/Metadata';

describe('the Metadata model', () => {
  let supportedWalletCurStub;

  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };

    supportedWalletCurStub = (() => {
      const originalIsSupportedWalletCur = walletCurMod.isSupportedWalletCur;
      return sinon.stub(walletCurMod, 'isSupportedWalletCur',
        (cur, options = {}) => (
          originalIsSupportedWalletCur(cur, {
            ...options,
            serverCurs: ['BTC', 'ZEC'],
          })
        ));
    })();
  });

  it('fails validation if the contract type is not one of the available types', () => {
    const metadata = new Metadata();
    metadata.set({
      contractType: 'boom bam bizzle',
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.contractType && !!valErr.contractType.length || false).to.equal(true);
  });

  it('fails validation if a date in the past is provided', () => {
    const metadata = new Metadata();
    metadata.set({
      expiry: (new Date(1937, 11, 31, 0, 0, 0, 0)).toISOString(),
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.expiry && !!valErr.expiry.length || false).to.equal(true);
  });

  it('fails validation if a date beyond 2038 is provided', () => {
    const metadata = new Metadata();
    metadata.set({
      expiry: (new Date(2038, 5, 5, 0, 0, 0, 0)).toISOString(),
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.expiry && !!valErr.expiry.length || false).to.equal(true);
  });

  it('fails validation if a pricing currency is not one of the available ones', () => {
    const metadata = new Metadata();
    metadata.set({
      pricingCurrency: 'FOOLS-GOLD_YALL',
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.pricingCurrency && !!valErr.pricingCurrency.length || false).to
      .equal(true);
  });

  it('fails validation if an accepted currency is not provided as an array', () => {
    const metadata = new Metadata();
    metadata.set({
      acceptedCurrencies: true,
    }, { validate: true });
    const valErr1 = metadata.validationError;

    const metadata2 = new Metadata();
    metadata2.set({
      acceptedCurrencies: 99,
    }, { validate: true });
    const valErr2 = metadata2.validationError;

    const metadata3 = new Metadata();
    metadata3.set({
      acceptedCurrencies: 'BTC',
    }, { validate: true });
    const valErr3 = metadata3.validationError;

    expect(
      valErr1 && valErr1.acceptedCurrencies && !!valErr1.acceptedCurrencies.length &&
      valErr2 && valErr2.acceptedCurrencies && !!valErr2.acceptedCurrencies.length &&
      valErr3 && valErr3.acceptedCurrencies && !!valErr3.acceptedCurrencies.length || false
    ).to
      .equal(true);
  });

  it('fails validation if an empty accepted currency array is provided', () => {
    const metadata = new Metadata();
    metadata.set({
      acceptedCurrencies: [],
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.acceptedCurrencies && !!valErr.acceptedCurrencies.length || false).to
      .equal(true);
  });

  it('fails validation if an accepted currency array is provided with one or more non-string / '
    + 'non-empty string entries', () => {
    const metadata = new Metadata();
    metadata.set({
      acceptedCurrencies: ['BTC', 'BCH', null],
    }, { validate: true });
    const valErr1 = metadata.validationError;

    const metadata2 = new Metadata();
    metadata2.set({
      acceptedCurrencies: ['BTC', 'BCH', 99],
    }, { validate: true });
    const valErr2 = metadata2.validationError;

    const metadata3 = new Metadata();
    metadata3.set({
      acceptedCurrencies: ['BTC', 'BCH', ''],
    }, { validate: true });
    const valErr3 = metadata3.validationError;

    expect(
      valErr1 && valErr1.acceptedCurrencies && !!valErr1.acceptedCurrencies.length &&
      valErr2 && valErr2.acceptedCurrencies && !!valErr2.acceptedCurrencies.length &&
      valErr3 && valErr3.acceptedCurrencies && !!valErr3.acceptedCurrencies.length || false
    ).to
      .equal(true);
  });

  it('fails validation if more than one accepted currency is provided for a ' +
    'CRYPTOCURRENCY listing type.', () => {
    const metadata = new Metadata();
    metadata.set({
      contractType: 'CRYPTOCURRENCY',
      acceptedCurrencies: ['BTC', 'BCH'],
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.acceptedCurrencies && !!valErr.acceptedCurrencies.length || false).to
      .equal(true);
  });

  it('passes validation if only one accepted currency is provided for a ' +
    'non-CRYPTOCURRENCY listing type.', () => {
    const metadata = new Metadata();
    metadata.set({
      contractType: 'PHYSICAL_GOOD',
      acceptedCurrencies: ['BTC'],
    }, { validate: true });
    const valErr = metadata.validationError;

    expect(valErr && valErr.acceptedCurrencies === undefined).to
      .equal(true);
  });

  it('ensures the acceptedCurrencies consist of only supported wallet currencies.', () => {
    const metadata = new Metadata();
    metadata.set({
      contractType: 'PHYSICAL_GOOD',
      acceptedCurrencies: ['BTC', 'BCH'],
    }, { validate: true });
    const valErr1 = metadata.validationError;

    const metadata2 = new Metadata();
    metadata2.set({
      contractType: 'PHYSICAL_GOOD',
      acceptedCurrencies: ['ZEC', 'BTC'],
    }, { validate: true });
    const valErr2 = metadata2.validationError;

    const metadata3 = new Metadata();
    metadata3.set({
      contractType: 'CRYPTOCURRENCY',
      acceptedCurrencies: ['BCH'],
    }, { validate: true });
    const valErr3 = metadata3.validationError;

    const metadata4 = new Metadata();
    metadata4.set({
      contractType: 'CRYPTOCURRENCY',
      acceptedCurrencies: ['ZEC'],
    }, { validate: true });
    const valErr4 = metadata4.validationError;

    expect(
      valErr1 && valErr1.acceptedCurrencies && !!valErr1.acceptedCurrencies.length &&
      !(valErr2 && valErr2.acceptedCurrencies && !!valErr2.acceptedCurrencies.length) &&
      valErr3 && valErr3.acceptedCurrencies && !!valErr3.acceptedCurrencies.length &&
      !(valErr4 && valErr4.acceptedCurrencies && !!valErr4.acceptedCurrencies.length) || false
    ).to
      .equal(true);
  });

  after(function () {
    supportedWalletCurStub.restore();
  });
});

