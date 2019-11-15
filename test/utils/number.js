import { expect } from 'chai';
import { describe, it } from 'mocha';
import bigNumber from 'bignumber.js';
import { upToFixed, toStandardNotation } from '../../js/utils/number';

describe('the number utility module', () => {
  it('correctly limits a number to a given number of decimal place and ' +
    'returns a string', () => {
    expect(upToFixed(12, 2)).to.equal('12');
    expect(upToFixed(12.2, 2)).to.equal('12.2');
    expect(upToFixed(12.23, 2)).to.equal('12.23');
    expect(upToFixed(12.239, 2)).to.equal('12.24');
  });

  describe('has a toStandardNotation function', () => {
    it('that correctly displays numbers in standard notation', () => {
      expect(toStandardNotation(1000000000000000000000)).to.equal('1000000000000000000000');
      expect(toStandardNotation('1000000000000000000000')).to.equal('1000000000000000000000');
      expect(
        toStandardNotation(bigNumber(1000000000000000000000))
      ).to.equal('1000000000000000000000');
    });

    it('optionally returns the value unchanged if it\'s not numeric', () => {
      expect(toStandardNotation('sally')).to.equal('sally');
      expect(toStandardNotation(null)).to.equal(null);
      expect(toStandardNotation(false)).to.equal(false);
    });
  });
});
