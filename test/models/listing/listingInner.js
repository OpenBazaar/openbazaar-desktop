import { expect } from 'chai';
import { describe, it } from 'mocha';
import ListingInner from '../../../js/models/listing/ListingInner';

describe('the ListingInner model', () => {
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
