import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Listing from '../../../js/models/listing/Listing';

describe('the Listing model', () => {
  before(function () {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('throws an error if you attempt to fetch without a guid being set', () => {
    const listing = new Listing({
      listing: { slug: 'a-happy-slug' },
    });

    let errorThrown = false;

    try {
      listing.fetch();
    } catch (e) {
      errorThrown = true;
    }

    expect(errorThrown).to.equal(true);
  });

  it('throws an error if you attempt to fetch without a slug set' +
    ' on the nested listing model', () => {
    const listing = new Listing({}, { guid: '12345' });

    let errorThrown = false;

    try {
      listing.fetch();
    } catch (e) {
      errorThrown = true;
    }

    expect(errorThrown).to.equal(true);
  });

  it('does not throw an error if you attempt to fetch with a guid and slug both set', () => {
    const listing = new Listing({
      listing: { slug: 'a-happy-slug' },
    }, { guid: '12345' });

    let errorThrown = false;

    try {
      listing.fetch();
    } catch (e) {
      errorThrown = true;
    }

    expect(errorThrown).to.equal(false);
  });

  it('converts a fiat price from an integer to decimal format in parse', () => {
    const listing = new Listing();
    const parsed = listing.parse({
      vendorListings: [
        {
          metadata: {
            pricingCurrency: 'USD',
          },
          item: {
            price: 123,
          },
        },
      ],
    });

    expect(parsed.listing.item.price).to.equal(1.23);
  });

  it('converts a BTC price from Satoshi to BTC format in parse', () => {
    const listing = new Listing();
    const parsed = listing.parse({
      vendorListings: [
        {
          metadata: {
            pricingCurrency: 'BTC',
          },
          item: {
            price: 271453590,
          },
        },
      ],
    });

    expect(parsed.listing.item.price).to.equal(2.71);
  });

  it('saves with a POST if the model\'s lastSyncedAttrs do not contain a slug', (done) => {
    const listing = new Listing({
      listing: { slug: 'a-happy-slug' },
    }, { guid: '12345' });

    const sync = listing.sync('create', listing, { url: 'no-server' });
    let type;

    // since we have no server, we'll pass in a bogus url to ensure
    // an expediant failure, which will still gives us the data we need
    sync.fail(function () {
      type = this.type;

      expect(type).to.equal('POST');
      done();
    });
  });

  it('saves with a PUT if the model\'s lastSyncedAttrs do contain a slug', (done) => {
    const listing = new Listing({
      listing: { slug: 'a-happy-slug' },
    }, { guid: '12345' });

    listing.lastSyncedAttrs = {
      listing: {
        slug: 'i-am-thor-hear-me-roar',
      },
    };

    const sync = listing.sync('create', listing, { url: 'no-server' });
    let type;

    // since we have no server, we'll pass in a bogus url to ensure
    // an expediant failure, which will still gives us the data we need
    sync.fail(function () {
      type = this.type;

      expect(type).to.equal('PUT');
      done();
    });
  });

  // todo: spot check nested val errors
});
