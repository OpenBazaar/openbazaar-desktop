import { expect } from 'chai';
import { describe, it } from 'mocha';
import _ from 'underscore';
import countries, { getCountryByDataName } from '../../js/data/countries';

if (countries.length) {
  describe('the country data module', () => {
    it('returns a country by dataName', () => {
      const dataName = countries[0].dataName;

      expect(_.omit(countries[0], 'dataName')).to.deep.equal(getCountryByDataName(dataName));
    });
  });
}
