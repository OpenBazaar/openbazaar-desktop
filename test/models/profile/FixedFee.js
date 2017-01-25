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

  it('fails validation if the amount is not a number', () => {
    const fixedFee = new FixedFee();
    fixedFee.set({ amount: 'test' }, { validate: true });
    const valErr = fixedFee.validationError;

    expect(valErr && valErr.feeTypeNoAmount
      && !!valErr.feeTypeNoAmount.length || false).to.equal(true);
  });
});
