import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import FixedFee from '../../../js/models/profile/FixedFee';

describe('the Fixed Fee model', () => {
  before(function () {
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the amount does not exist', () => {
    const fixedFee = new FixedFee();
    fixedFee.unset('amount');
    fixedFee.set({}, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.feeType && !!valErr.feeType.length).to.equal(true);
  });

  it('fails validation if the amount is not a number', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ amount: 'test' }, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.feeType && !!valErr.feeType.length).to.equal(true);
  });

  it('fails validation if the currency code does not exist', () => {
    const fixedFee = new FixedFee();
    fixedFee.unset('currencyCode');
    fixedFee.set({}, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.feeType && !!valErr.feeType.length).to.equal(true);
  });

  it('fails validation if the currency code is not a string', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ currencyCode: 1 }, { validate: true });
    const valErr = fixedFee.validationError;
    expect(valErr && valErr.feeType && !!valErr.feeType.length).to.equal(true);
  });

  it('fails validation if the currency code is not a known code', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ currencyCode: 'FOO' }, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.feeType && !!valErr.feeType.length).to.equal(true);
  });
});
