import app from '../../../js/app';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import Moderator from '../../../js/models/profile/Moderator';

describe('the Moderator model', () => {
  before(function () {
    app.polyglot = {
      t: (str) => str,
    };
  });

  it('fails validation if no description was set', () => {
    const moderator = new Moderator();
    moderator.set({}, { validate: true });
    const valErr = moderator.validationError;

    expect(valErr && valErr.description
      && !!valErr.description.length || false).to.equal(true);
  });

  it('fails validation if the description exceeds the maximum length', () => {
    const moderator = new Moderator();
    const testString = 'X'.repeat(301);
    moderator.set({ description: testString }, { validate: true });
    const valErr = moderator.validationError;

    expect(valErr && valErr.description
      && !!valErr.description.length || false).to.equal(true);
  });

  it('fails validation if no terms and conditions were set', () => {
    const moderator = new Moderator();
    moderator.set({}, { validate: true });
    const valErr = moderator.validationError;

    expect(valErr && valErr.termsAndConditions
      && !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if the terms amd conditions exceed the maximum length', () => {
    const moderator = new Moderator();
    const testString = 'X'.repeat(10001);
    moderator.set({ termsAndConditions: testString }, { validate: true });
    const valErr = moderator.validationError;

    expect(valErr && valErr.termsAndConditions
      && !!valErr.termsAndConditions.length || false).to.equal(true);
  });

  it('fails validation if the language array is empty', () => {
    const moderator = new Moderator();
    moderator.set({}, { validate: true });
    const valErr = moderator.validationError;

    expect(valErr && valErr.languages
      && !!valErr.languages.length || false).to.equal(true);
  });
});
