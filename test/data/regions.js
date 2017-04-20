import { expect } from 'chai';
import { describe, it } from 'mocha';
import regions from '../../js/data/regions';
import { getIndexedCountries } from '../../js/data/countries';

describe('the regions data module', () => {
  it('has regions which comprise of only countries that are represented' +
    ' in the countries module', () => {
    const everyCountryIsLegit = regions.every(region =>
      region.countries.every(country => !!getIndexedCountries()[country]));

    expect(everyCountryIsLegit).to.equal(true);
  });
});
