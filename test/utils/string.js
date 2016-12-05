import { expect } from 'chai';
import { describe, it } from 'mocha';
import { capitalize } from '../../js/utils/string';

describe('the string utility module', () => {
  it('correctly capitalizes a string', () => {
    expect(capitalize('hello')).to.equal('Hello');
    expect(capitalize('Meatballs')).to.equal('Meatballs');
    expect(capitalize('Charlie')).to.equal('Charlie');
    expect(capitalize('!what the')).to.equal('!what the');
    expect(capitalize('check it dog.')).to.equal('Check it dog.');
  });
});
