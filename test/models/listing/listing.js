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

  it('throws an error if you attempt to instantiate without providing a guid', () => {
    let errorThrown = false;

    try {
      const listing = new Listing({ // eslint-disable-line no-unused-vars
        listing: { slug: 'a-happy-slug' },
      });
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

  it('converts fiat prices from integer to decimal format in parse', () => {
    const listing = new Listing({}, { guid: '12345' });
    const parsed = listing.parse({
      vendorListings: [
        {
          metadata: {
            pricingCurrency: 'USD',
          },
          item: {
            price: 123,
          },
          shippingOptions: [
            {
              services: [
                {
                  price: 123,
                },
                {
                  price: 234,
                },
              ],
            },
            {
              services: [
                {
                  price: 456,
                },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.listing.item.price).to.equal(1.23);
    expect(parsed.listing.shippingOptions[0].services[0].price).to.equal(1.23);
    expect(parsed.listing.shippingOptions[0].services[1].price).to.equal(2.34);
    expect(parsed.listing.shippingOptions[1].services[0].price).to.equal(4.56);
  });

  it('converts BTC prices from Satoshi to BTC format in parse', () => {
    const listing = new Listing({}, { guid: '12345' });
    const parsed = listing.parse({
      vendorListings: [
        {
          metadata: {
            pricingCurrency: 'BTC',
          },
          item: {
            price: 271453590,
          },
          shippingOptions: [
            {
              services: [
                {
                  price: 271453590,
                },
                {
                  price: 873927651,
                },
              ],
            },
            {
              services: [
                {
                  price: 281649276,
                },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.listing.item.price).to.equal(2.71453590);
    expect(parsed.listing.shippingOptions[0].services[0].price).to.equal(2.71453590);
    expect(parsed.listing.shippingOptions[0].services[1].price).to.equal(8.73927651);
    expect(parsed.listing.shippingOptions[1].services[0].price).to.equal(2.81649276);
  });

  // todo: figure out how to stub BaseModel.sync so we could test conversion
  // of prices from integers to decimals in sync

  // todo: test that isNew is based off of the new slug being set

  // todo: on a successful create, check that the returned slug is properly
  // stored on the nested listing model. Need to figure out a way to
  // stub sync.

  // todo: spot check nested val errors
});
