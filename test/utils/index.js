import { expect } from 'chai';
import { describe, it } from 'mocha';
import { splitIntoRows, abbrNum } from '../../js/utils';

describe('our index utilities', () => {
  describe('have a splitIntoRows utility that', () => {
    it('requires an array of items to be passed in', () => {
      let errorsThrown = 0;

      try {
        splitIntoRows();
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows('sugar');
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows(99);
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows(false);
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows(null);
      } catch (e) {
        errorsThrown += 1;
      }

      expect(errorsThrown).to.equal(5);
    });

    it('requires itemsPerRow to be provided as a number', () => {
      let errorsThrown = 0;

      try {
        splitIntoRows([9, 8]);
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows([9, 8], 'sugar');
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows([9, 8], false);
      } catch (e) {
        errorsThrown += 1;
      }

      try {
        splitIntoRows([9, 8], null);
      } catch (e) {
        errorsThrown += 1;
      }

      expect(errorsThrown).to.equal(4);
    });

    it('returns an array split into sub arrays based on the itemsPerRow value', () => {
      splitIntoRows([9, 8, 7, 6, 5, 4, 3], 2);

      expect(splitIntoRows([9, 8, 7, 6, 5, 4, 3], 2)).to.deep.equal([[9, 8], [7, 6], [5, 4], [3]]);
    });
  });

  describe('have a abbrNum utility that', () => {
    it('returns abbreviated a rounded number for (1000(n) & max trillion)', () => {
      const sourceNumberSet = [123, 1266, 125468,
                             77547959, 388475766449,
                             48242478968789, 482424789687893242];
      const formattedNumberSet = ['123', '1.3k', '125.47k',
                                '77.548m', '388.476b',
                                '48.242t', '482,424.79t'];
      for (let i = 0; i < sourceNumberSet.length; i++) {
        expect(abbrNum(sourceNumberSet[i], i)).to.be.a('string');
        expect(abbrNum(sourceNumberSet[i], i)).to.be.equal(formattedNumberSet[i]);
      }
    });

    it('returns abbreviated a rounded negative number for (1000(n) & max trillion)', () => {
      const sourceNumberSet = [-123, -1266, -125468,
                             -77547959, -388475766449,
                             -48242478968789, -482424789687893242];
      const formattedNumberSet = ['-123', '-1.3k', '-125.47k',
                                '-77.548m', '-388.476b',
                                '-48.242t', '-482,424.79t'];
      for (let i = 0; i < sourceNumberSet.length; i++) {
        expect(abbrNum(sourceNumberSet[i], i)).to.be.a('string');
        expect(abbrNum(sourceNumberSet[i], i)).to.be.equal(formattedNumberSet[i]);
      }
    });
  });
});

