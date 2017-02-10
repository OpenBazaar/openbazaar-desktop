import { expect } from 'chai';
import { describe, it } from 'mocha';
import { upToFixed } from '../../js/utils/number';

describe('the number utility module', () => {
  it('correctly limits a number to a given number of decimal place and ' +
    'returns a string', () => {
    expect(upToFixed(12, 2)).to.equal('12');
    expect(upToFixed(12.2, 2)).to.equal('12.2');
    expect(upToFixed(12.23, 2)).to.equal('12.23');
    expect(upToFixed(12.239, 2)).to.equal('12.24');
  });
});
