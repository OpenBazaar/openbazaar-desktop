import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Price from '../../../js/models/listing/Price';

describe('the Price model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if an amount is not provided', () => {
    const price = new Price();
    price.set({}, { validate: true });
    const valErr = price.validationError;

    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);
  });

  it('fails validation if an amount is not provided as a number', () => {
    const price = new Price();
    price.set({
      amount: 'lots',
    }, { validate: true });
    const valErr = price.validationError;

    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);
  });

  it('fails validation if an amount less than 0 is provided', () => {
    const price = new Price();
    price.set({
      amount: -123,
    }, { validate: true });
    const valErr = price.validationError;

    expect(valErr && valErr.amount && !!valErr.amount.length || false).to.equal(true);
  });

  it('fails validation if a currency code is not provided', () => {
    const price = new Price();
    price.unset('currencyCode');
    price.set({}, { validate: true });
    const valErr = price.validationError;

    expect(valErr && valErr.currencyCode && !!valErr.currencyCode.length || false).to.equal(true);
  });

  // todo: test convertPriceOut & convertPriceIn
});
