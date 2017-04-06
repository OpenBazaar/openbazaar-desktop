import { expect } from 'chai';
import { describe, it } from 'mocha';
import Listings from '../../js/collections/Listings';

describe('the Listings collection', () => {
  describe('has a categories getter', () => {
    it('that returns a combined and sorted list of categories from all the listings in the' +
      ' collection', () => {
      // Please Note: As of now, sorting only works on standard ascii characters.

      const listing = new Listings([{
        categories: ['uno', 'dos', 'tres'],
      }, {
        categories: ['one', 'two', 'three'],
      }, {
        categories: ['raz', 'dwa', 'trzy'],
      }], { guid: 'QmZY1kx6VrNjgDB4SJDByxvSVuiBfsisRLdUMJRDppTTsS' });

      const expectedCats = ['dos', 'dwa', 'one', 'raz', 'three', 'tres', 'trzy', 'two', 'uno'];
      expect(listing.categories).to.deep.equal(expectedCats);
    });

    it('that returns a list of categories without duplicates', () => {
      const listing = new Listings([{
        categories: ['uno', 'dos', 'tres'],
      }, {
        categories: ['uno', 'two', 'three'],
      }, {
        categories: ['raz', 'dos', 'trzy'],
      }], { guid: 'QmZY1kx6VrNjgDB4SJDByxvSVuiBfsisRLdUMJRDppTTsS' });

      const expectedCats = ['dos', 'raz', 'three', 'tres', 'trzy', 'two', 'uno'];
      expect(listing.categories).to.deep.equal(expectedCats);
    });
  });
});
