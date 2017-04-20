import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Fee from '../../../js/models/profile/Fee';

describe('the Fee model', () => {
  before(function () {
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the fee type is invalid', () => {
    const fee = new Fee();
    fee.set({ feeType: 'Test' }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the fee type is not set', () => {
    const fee = new Fee();
    fee.unset('feeType');
    fee.set({}, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the percentage is not set', () => {
    const fee = new Fee();
    fee.unset('percentage');
    fee.set({}, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the feeType is percentage and the percentage is not a number', () => {
    const fee = new Fee();
    fee.set({ feeType: 'PERCENTAGE', percentage: 'Test' }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  // one test to make sure the percentage tests also work if the type is fixed plus percentage
  it('fails validation if the feeType is fixed plus percentage ' +
    'and the percentage is not a number', () => {
    const fee = new Fee();
    fee.set({ feeType: 'FIXED_PLUS_PERCENTAGE', percentage: 'Test' }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the feeType is percentage and the percentage is less than zero', () => {
    const fee = new Fee();
    fee.set({ feeType: 'PERCENTAGE', percentage: -10 }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the feeType is percentage and the percentage is over 100', () => {
    const fee = new Fee();
    fee.set({ feeType: 'PERCENTAGE', percentage: 101 }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });

  it('fails validation if the feeType is percentage ' +
    'and the percentage has more than 2 decimal places', () => {
    const fee = new Fee();
    fee.set({ feeType: 'PERCENTAGE', percentage: 19.325 }, { validate: true });
    const valErr = fee.validationError;

    expect(valErr && valErr.feeType
      && !!valErr.feeType.length || false).to.equal(true);
  });
});
