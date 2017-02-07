import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import ListingInner from '../../../js/models/listing/ListingInner';

describe('the ListingInner model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the refund policy is not provided as a string', () => {
    const listingInner = new ListingInner();
    listingInner.set({
      refundPolicy: 12345,
    }, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.refundPolicy && !!valErr.refundPolicy.length || false).to.equal(true);
  });

  it('fails validation if the refund policy exceeds the maximum length', () => {
    let refundPolicy = '';
    const listingInner = new ListingInner();

    for (let i = 0; i < (listingInner.max.refundPolicyLength + 1); i++) {
      refundPolicy += 'a';
    }

    listingInner.set({ refundPolicy }, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.refundPolicy && !!valErr.refundPolicy.length || false).to.equal(true);
  });

  it('fails validation if the terms and conditions are not provided as a string', () => {
    const listingInner = new ListingInner();
    listingInner.set({
      termsAndConditions: 12345,
    }, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.termsAndConditions &&
      !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if the terms and conditions exceed the maximum length', () => {
    let termsAndConditions = '';
    const listingInner = new ListingInner();

    for (let i = 0; i < (listingInner.max.termsAndConditionsLength + 1); i++) {
      termsAndConditions += 'a';
    }

    listingInner.set({ termsAndConditions }, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.termsAndConditions &&
      !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if, for a physical good, at least one shipping options is not provided',
    () => {
      const listingInner = new ListingInner();

      listingInner.get('metadata').set('contractType', 'PHYSICAL_GOOD');

      listingInner.set({
        shippingOptions: [],
      }, { validate: true });

      const valErr = listingInner.validationError;

      expect(valErr && valErr.shippingOptions &&
        !!valErr.shippingOptions.length || false).to.equal(true);
    });

  // todo: spot check nested val errors
});
