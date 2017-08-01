import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import SocialAccount from '../../../js/models/profile/SocialAccount';

describe('the Social Account model', () => {
  before(() => {
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if the the username is not a string', () => {
    const socialAccount = new SocialAccount();
    socialAccount.set({ username: 3 }, { validate: true });
    const valErr = socialAccount.validationError;

    expect(valErr && valErr.username && !!valErr.username.length || false).to.equal(true);
  });

  it('fails validation if the username is not set', () => {
    const socialAccount = new SocialAccount();
    socialAccount.unset('username');
    socialAccount.set({}, { validate: true });
    const valErr = socialAccount.validationError;

    expect(valErr && valErr.username && !!valErr.username.length || false).to.equal(true);
  });

  it('fails validation if the the type is not a string', () => {
    const socialAccount = new SocialAccount();
    socialAccount.set({ type: 3 }, { validate: true });
    const valErr = socialAccount.validationError;

    expect(valErr && valErr.type && !!valErr.type.length || false).to.equal(true);
  });

  it('fails validation if the type is not set', () => {
    const socialAccount = new SocialAccount();
    socialAccount.unset('type');
    socialAccount.set({}, { validate: true });
    const valErr = socialAccount.validationError;

    expect(valErr && valErr.type && !!valErr.type.length || false).to.equal(true);
  });
});
