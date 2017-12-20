import { expect } from 'chai';
import { describe, it } from 'mocha';
import Results from '../../js/collections/Results';
import ListingShort from '../../js/models/listing/ListingShort';
import Profile from '../../js/models/profile/Profile';

const fakeResults1 = {
  results: {
    morePages: true,
    total: 1,
    results: [
      {
        type: 'listing',
        data: {
          price: {
            amount: 1,
            currencyCode: 'PHR',
          },
        },
        relationships: {
          vendor: {
            data: {
              handle: '@testVendor1',
              id: 'QmYQ2v7npEAEi7GpQgsW9k4Ucmz7ixeaenmtyLz3Shxrzz',
            },
          },
        },
      },
      {
        type: 'listing',
        data: {
          price: {
            amount: 2,
            currencyCode: 'usd',
          },
        },
        relationships: {
          vendor: {
            data: {
              handle: '@testVendor2',
              id: 'QmYQ2v7npEAEi7GpQgsW9k4Ucmz7ixeaenmtyLz3Shxrzy',
            },
          },
        },
      },
      {
        type: 'profile',
        data: {
          peerID: 'QmYQ2v7npEAEi7GpQgsW9k4Ucmz7ixeaenmtyLz3Shxrzw',
        },
      },
    ],
  },
};

describe('the Results collection', () => {
  it('sets a total parameter based on the parsed results', () => {
    const resCol = new Results();
    resCol.add(resCol.parse(fakeResults1));

    expect(resCol.total).to.equal(1);
  });

  it('sets a morePages parameter based on the parsed results', () => {
    const resCol = new Results();
    resCol.add(resCol.parse(fakeResults1));

    expect(resCol.morePages).to.equal(true);
  });

  it('will create 3 listings if 3 listings are in the results', () => {
    const resCol = new Results();
    resCol.add(resCol.parse(fakeResults1));

    expect(resCol.length).to.equal(3);
  });

  it('will use the listingCard model for listing results, ' +
      'and the profile model for profile results', () => {
    const resCol = new Results();
    resCol.add(resCol.parse(fakeResults1));

    expect(resCol.at(0) instanceof ListingShort).to.equal(true);
    expect(resCol.at(2) instanceof Profile).to.equal(true);
  });
});
