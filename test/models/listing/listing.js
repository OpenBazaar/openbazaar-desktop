import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Listing from '../../../js/models/listing/Listing';

describe('the Listing model', () => {
  before(() => {
    // creating a dummy polyglot t function, so our
    // model doesn't bomb. It's not critical to these
    // tests that it return an actual translation.
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('throws an error if you attempt to fetcha listing without a guid set.', () => {
    const listing = new Listing({
      slug: 'a-happy-slug',
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

  it('changes a hash in the response to a hash in parse', () => {
    const listing = new Listing({}, { guid: '12345' });
    const parsed = listing.parse({
      hash: 'test',
      listing: {},
    });
    expect(parsed.hash).to.equal('test');
  });

  it('converts fiat prices from integer to decimal format in parse', () => {
    const listing = new Listing({}, { guid: '12345' });
    const parsed = listing.parse({
      listing: {
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
        coupons: [
          {
            priceDiscount: 1333,
          },
        ],
      },
    });

    expect(parsed.item.price).to.equal(1.23);
    expect(parsed.shippingOptions[0].services[0].price).to.equal(1.23);
    expect(parsed.shippingOptions[0].services[1].price).to.equal(2.34);
    expect(parsed.shippingOptions[1].services[0].price).to.equal(4.56);
    expect(parsed.coupons[0].priceDiscount).to.equal(13.33);
  });

  it('converts BTC prices from Satoshi to BTC format in parse', () => {
    const listing = new Listing({}, { guid: '12345' });
    const parsed = listing.parse({
      listing: {
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
        coupons: [
          {
            priceDiscount: 1333,
          },
          {
            priceDiscount: 281649276,
          },
        ],
      },
    });

    expect(parsed.item.price).to.equal(2.71453590);
    expect(parsed.shippingOptions[0].services[0].price).to.equal(2.71453590);
    expect(parsed.shippingOptions[0].services[1].price).to.equal(8.73927651);
    expect(parsed.shippingOptions[1].services[0].price).to.equal(2.81649276);
    expect(parsed.coupons[0].priceDiscount).to.equal(0.00001333);
    expect(parsed.coupons[1].priceDiscount).to.equal(2.81649276);
  });

  it('fails validation if the refund policy is not provided as a string', () => {
    const listing = new Listing();
    listing.set({
      refundPolicy: 12345,
    }, { validate: true });
    const valErr = listing.validationError;

    expect(valErr && valErr.refundPolicy && !!valErr.refundPolicy.length || false).to.equal(true);
  });

  it('fails validation if the refund policy exceeds the maximum length', () => {
    let refundPolicy = '';
    const listing = new Listing();

    for (let i = 0; i < (listing.max.refundPolicyLength + 1); i++) {
      refundPolicy += 'a';
    }

    listing.set({ refundPolicy }, { validate: true });
    const valErr = listing.validationError;

    expect(valErr && valErr.refundPolicy && !!valErr.refundPolicy.length || false).to.equal(true);
  });

  it('fails validation if the terms and conditions are not provided as a string', () => {
    const listing = new Listing();
    listing.set({
      termsAndConditions: 12345,
    }, { validate: true });
    const valErr = listing.validationError;

    expect(valErr && valErr.termsAndConditions &&
        !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if the terms and conditions exceed the maximum length', () => {
    let termsAndConditions = '';
    const listing = new Listing();

    for (let i = 0; i < (listing.max.termsAndConditionsLength + 1); i++) {
      termsAndConditions += 'a';
    }

    listing.set({ termsAndConditions }, { validate: true });
    const valErr = listing.validationError;

    expect(valErr && valErr.termsAndConditions &&
        !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if, for a physical good, at least one shipping options is not provided',
    () => {
      const listing = new Listing();

      listing.get('metadata').set('contractType', 'PHYSICAL_GOOD');

      listing.set({
        shippingOptions: [],
      }, { validate: true });

      const valErr = listing.validationError;

      expect(valErr && valErr.shippingOptions &&
          !!valErr.shippingOptions.length || false).to.equal(true);
    });

  it('fails validation if the coupon count exceeds the maximum allowable amount', () => {
    const listing = new Listing();
    const couponData = [];

    for (let i = 0; i < (listing.max.couponCount + 1); i++) {
      couponData.push({
        discountCode: Date.now() + Math.random(),
        percentDiscount: 10,
      });
    }

    listing.set({
      coupons: couponData,
    }, { validate: true });

    const valErr = listing.validationError;

    expect(valErr && valErr.coupons &&
        !!valErr.coupons.length || false).to.equal(true);
  });

  it('fails validation if a coupon price exceeds the listing price', () => {
    const listing = new Listing();

    listing.set({
      item: {
        price: 500,
      },
      coupons: [
        {
          discountCode: Date.now() + Math.random(),
          priceDiscount: 499.99, // should not fail validation
        },
        {
          discountCode: Date.now() + Math.random(),
          priceDiscount: 501, // should fail validation
        },
        {
          discountCode: Date.now() + Math.random(),
          priceDiscount: 1500, // should fail validation
        },
      ],
    }, { validate: true });

    const valErr = listing.validationError;
    const coupons = listing.get('coupons');

    expect(valErr && valErr[`coupons[${coupons.at(0).cid}].priceDiscount`] &&
        !!valErr[`coupons[${coupons.at(0).cid}].priceDiscount`].length || false)
        .to.equal(false);

    expect(valErr && valErr[`coupons[${coupons.at(1).cid}].priceDiscount`] &&
        !!valErr[`coupons[${coupons.at(1).cid}].priceDiscount`].length || false)
        .to.equal(true);

    expect(valErr && valErr[`coupons[${coupons.at(2).cid}].priceDiscount`] &&
        !!valErr[`coupons[${coupons.at(2).cid}].priceDiscount`].length || false)
        .to.equal(true);
  });

  // todo: figure out how to stub BaseModel.sync so we could test conversion
  // of prices from integers to decimals in sync

  // todo: test that isNew is based off of the new slug being set

  // todo: on a successful create, check that the returned slug is properly
  // stored on the nested listing model. Need to figure out a way to
  // stub sync.

  // todo: spot check nested val errors
});
