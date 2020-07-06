import bigNumber from 'bignumber.js';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import app from '../../../js/app';
import FixedFee from '../../../js/models/profile/FixedFee';

describe('the Fixed Fee model', () => {
  before(function () {
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the amount does not contain a valid currency amount', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({
      amount: bigNumber('100'), // valid
      currencyCode: 'BTC',
    }, { validate: true });
    let valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(false);

    fixedFee.set({
      amount: bigNumber('0.00000001'), // valid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(false);

    fixedFee.set({
      amount: true, // invalid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);

    fixedFee.set({
      amount: 100, // invalid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);

    fixedFee.set({
      amount: bigNumber('-1'), // invalid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);

    fixedFee.set({
      amount: bigNumber('0.000000009'), // invalid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);

    fixedFee.unset('amount'); // amount is required, validation should fail
    fixedFee.set({}, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);

    fixedFee.set({
      amount: '100', // invalid
    }, { validate: true });
    valErr = fixedFee.validationError;
    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);
  });

  it('fails validation if the currency code does not exist', () => {
    const fixedFee = new FixedFee();
    fixedFee.unset('currencyCode');
    fixedFee.set({}, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.currencyCode && !!valErr.currencyCode.length || false).to.equal(true);
  });

  it('fails validation if the currency code is not a string', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ currencyCode: 1 }, { validate: true });
    const valErr = fixedFee.validationError;
    expect(valErr && valErr.currencyCode && !!valErr.currencyCode.length || false).to.equal(true);
  });

  it('fails validation if the currency code is not a known code', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ currencyCode: 'FOO' }, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.currencyCode && !!valErr.currencyCode.length || false).to.equal(true);
  });
});
