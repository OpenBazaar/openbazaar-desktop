import { expect } from 'chai';
import { describe, it } from 'mocha';
import currencies from '../../js/data/cryptoCurrencies';

describe('the crypto currencies data module', () => {
  describe('has a config array of crypto currency configuration objects', () => {
    it('that requires a code to be provided as a string', () => {
      currencies.forEach(cur => {
        expect(typeof cur.code).to.equal('string');
      });
    });

    it('that, if provided, requires the testnetCode to be a string', () => {
      currencies.forEach(cur => {
        if (cur.testnetCode !== undefined) {
          expect(typeof cur.testnetCode).to.equal('string');
        }
      });
    });

    it('that, if provided, requires the symbol to be a string', () => {
      currencies.forEach(cur => {
        if (cur.symbol !== undefined) {
          expect(typeof cur.symbol).to.equal('string');
        }
      });
    });

    it('that requires the baseUnit to be a number > 0', () => {
      currencies.forEach(cur => {
        expect(typeof cur.baseUnit === 'number' && cur.baseUnit > 0).to.equal(true);
      });
    });

    it('that requires the minDisplayDecimals to be a number >= 0', () => {
      currencies.forEach(cur => {
        expect(typeof cur.minDisplayDecimals === 'number' && cur.minDisplayDecimals >= 0)
          .to.equal(true);
      });
    });

    it('that requires the maxDisplayDecimals to be a number > 0', () => {
      currencies.forEach(cur => {
        expect(typeof cur.maxDisplayDecimals === 'number' && cur.maxDisplayDecimals > 0)
          .to.equal(true);
      });
    });

    it('that requires the maxDisplayDecimals to be greater than or equal to the minDisplayDecimals',
      () => {
        currencies.forEach(cur => {
          expect(cur.maxDisplayDecimals >= cur.minDisplayDecimals).to.equal(true);
        });
      });

    it('that requires the averageModeratedTransactionSize to be a number > 0', () => {
      currencies.forEach(cur => {
        expect(typeof cur.averageModeratedTransactionSize === 'number' &&
          cur.averageModeratedTransactionSize > 0).to.equal(true);
      });
    });

    it('that requires the feeBumpTransactionSize to be undefined or a number > 0', () => {
      currencies.forEach(cur => {
        expect(typeof cur.feeBumpTransactionSize === 'undefined' ||
          (typeof cur.feeBumpTransactionSize === 'number' &&
          cur.feeBumpTransactionSize > 0)).to.equal(true);
      });
    });

    it('that requires the qrCodeText to be a function', () => {
      currencies.forEach(cur => {
        expect(typeof cur.qrCodeText).to.equal('function');
      });
    });

    it('that, if provided, requires the icon to be a string', () => {
      currencies.forEach(cur => {
        if (cur.icon !== undefined) {
          expect(typeof cur.icon).to.equal('string');
        }
      });
    });

    it('that, if provided, requires the needCoinLink to be a string', () => {
      currencies.forEach(cur => {
        if (cur.needCoinLink !== undefined) {
          expect(typeof cur.needCoinLink).to.equal('string');
        }
      });
    });

    it('that requires the getBlockChainAddressUrl to be a function', () => {
      currencies.forEach(cur => {
        expect(typeof cur.getBlockChainAddressUrl).to.equal('function');
      });
    });

    it('that requires the getBlockChainTxUrl to be a function', () => {
      currencies.forEach(cur => {
        expect(typeof cur.getBlockChainTxUrl).to.equal('function');
      });
    });

    it('that requires the getBlockChainTxUrl to be a function', () => {
      currencies.forEach(cur => {
        expect(typeof cur.getBlockChainTxUrl).to.equal('function');
      });
    });

    it('that requires the canShapeShiftIntoWallet to be a boolean', () => {
      currencies.forEach(cur => {
        expect(typeof cur.canShapeShiftIntoWallet).to.equal('boolean');
      });
    });

    // isValidAddress
    it('that, if provided, requires isValidAddress to be a function', () => {
      currencies.forEach(cur => {
        if (cur.isValidAddress !== undefined) {
          expect(typeof cur.isValidAddress).to.equal('function');
        }
      });
    });

    it('that, if provided, requires isValidAddress to be a function that returns a boolean ' +
      'or throws an exception', () => {
      currencies.forEach(cur => {
        if (cur.isValidAddress !== undefined) {
          let isValid;
          let exceptionThrown = false;

          try {
            isValid = cur.isValidAddress('abcdefghijklmnop');
          } catch (e) {
            exceptionThrown = true;
          }

          expect(typeof isValid === 'boolean' || exceptionThrown).to.equal(true);
        }
      });
    });
  });
});
