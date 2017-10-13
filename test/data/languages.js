import { expect } from 'chai';
import { describe, it } from 'mocha';
import _ from 'underscore';
import languages, { getLangByCode } from '../../js/data/languages';

if (languages.length) {
  describe('the language data module', () => {
    it('returns a language by code', () => {
      const code = languages[0].code;

      expect(_.omit(languages[0], 'code')).to.deep.equal(getLangByCode(code, false));
    });
  });
}
