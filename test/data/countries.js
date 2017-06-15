import app from '../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import _ from 'underscore';
import countries, { getCountryByDataName } from '../../js/data/countries';

if (countries.length) {
  describe('the country data module', () => {
    before(function () {
      // creating a dummy polyglot t function, so our
      // module doesn't bomb. It's not critical to these
      // tests that it return an actual translation.
      app.polyglot = {
        t: (str) => str,
      };
    });

    it('returns a country by dataName', () => {
      const dataName = countries[0].dataName;

      expect(_.omit(countries[0], 'dataName'))
        .to
        .deep
        .equal(_.omit(getCountryByDataName(dataName), 'translatedName'));
    });
  });
}
