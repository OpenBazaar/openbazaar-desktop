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

  it('fails validation if a slug is not provided', () => {
    const listingInner = new ListingInner();
    listingInner.set({}, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.slug && !!valErr.slug.length || false).to.equal(true);
  });

  it('fails validation if a slug is not provided as a string', () => {
    const listingInner = new ListingInner();
    listingInner.set({
      slug: 12345,
    }, { validate: true });
    const valErr = listingInner.validationError;

    expect(valErr && valErr.slug && !!valErr.slug.length || false).to.equal(true);
  });

  // todo: spot check nested val errors
});
