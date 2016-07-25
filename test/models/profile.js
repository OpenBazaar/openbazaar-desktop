import { expect } from 'chai';
import { describe, it } from 'mocha';
import Profile from '../../js/models/Profile';

describe('a profile model', () => {
  describe('has a social attribute', () => {
    // social contains a nested array - ensure the model determines changes
    // (and therefore change events) based on the array contents not the array
    // reference
    it('that results in a changed attribute if set with contents different' +
      ' from what it had been set to', () => {
      const social = [{
        name: 'john',
        type: 'twitter',
      }, {
        name: 'larry',
        type: 'facebook',
      }];

      const profile = new Profile({ social });

      // changing one of the social items
      social[0].name = 'skip';
      profile.set('social', social);
      expect(profile.changedAttributes()).to.not.equal(false);
      expect(profile.changedAttributes()).to.include.keys('social');

      // changing one of the social items on reference
      // obtained via get
      const anotherSocial = profile.get('social');
      anotherSocial[0].name = 'Dennis';
      profile.set('social', anotherSocial);
      expect(profile.changedAttributes()).to.not.equal(false);
      expect(profile.changedAttributes()).to.include.keys('social');

      // adding an additional social item
      social.push({ name: 'bill', type: 'instagram' });
      profile.set('social', social);
      expect(profile.changedAttributes()).to.not.equal(false);
      expect(profile.changedAttributes()).to.include.keys('social');

      // removing a social item
      social.splice(social.length - 1, 1);
      profile.set('social', social);
      expect(profile.changedAttributes()).to.not.equal(false);
      expect(profile.changedAttributes()).to.include.keys('social');
    });

    // even if setting to an object with a different reference, if contents are
    // the same, it won't be considered a change
    it('that does not result in a changed attribute if set with contents same' +
      ' as what they had been set to', () => {
      const social = [{
        name: 'john',
        type: 'twitter',
      }, {
        name: 'larry',
        type: 'facebook',
      }];

      const profile = new Profile({ social });

      profile.set('social', JSON.parse(JSON.stringify(social)));
      expect(profile.changedAttributes()).to.equal(false);

      profile.set('social', profile.get('social'));
      expect(profile.changedAttributes()).to.equal(false);
    });
  });
});
