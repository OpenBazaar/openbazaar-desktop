import { expect } from 'chai';
import { describe, it } from 'mocha';
import currencies, {
  supportedWalletCurs,
  isSupportedWalletCur,
  onlySupportedWalletCurs,
  anySupportedByWallet,
} from '../../js/data/walletCurrencies';

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

    it('that requires supportsEscrowTimeout to be a boolean', () => {
      currencies.forEach(cur => {
        expect(typeof cur.supportsEscrowTimeout).to.equal('boolean');
      });
    });

    it('that, if provided, requires blockTime to be a number', () => {
      currencies.forEach(cur => {
        if (cur.blockTime !== undefined) {
          expect(typeof cur.blockTime).to.equal('number');
        }
      });
    });
  });

  if (currencies.length) {
    describe('has a supportedWalletCurs function', () => {
      it('that will return the optionally provided serverCurs', () => {
        const curs = currencies.map(cur => cur.code);

        expect(
          supportedWalletCurs({
            clientSupported: true,
            serverCurs: [...curs],
          })
        ).deep.equal([...curs]);
      });

      it('that, if passing in a "true" clientSupported option, will not return a ' +
        'server currency if it is not a currency enumerated in the ' +
        'walletCurrencies data file', () => {
        expect(
          supportedWalletCurs({
            clientSupported: true,
            serverCurs: [currencies[0].code, 'NOT-CLIENT-SUPPORTED'],
          })
        ).deep.equal([currencies[0].code]);
      });

      it('that, if passing in a "false" clientSupported option, will return a ' +
        'server currency even if it is not a currency enumerated in the ' +
        'walletCurrencies data file', () => {
        expect(
          supportedWalletCurs({
            clientSupported: false,
            serverCurs: [currencies[0].code, 'NOT-CLIENT-SUPPORTED'],
          })
        ).deep.equal([currencies[0].code, 'NOT-CLIENT-SUPPORTED']);
      });
    });

    describe('has a isSupportedWalletCur function', () => {
      it('that will return false if the given currency is not a supported wallet ' +
        'currency', () => {
        expect(
          isSupportedWalletCur('NO-SOUP-FOR-YOU', {
            clientSupported: false,
            serverCurs: [currencies[0].code],
          })
        ).deep.equal(false);
      });

      it('that will return true if the given currency is a supported wallet ' +
        'currency', () => {
        expect(
          isSupportedWalletCur('SOUP-FOR-YOU', {
            clientSupported: false,
            serverCurs: ['SOUP-FOR-YOU'],
          })
        ).deep.equal(true);
      });

      it('that, if passing in a "true" clientSupported option, will return false ' +
        'if the given currency is not a currency enumerated in the ' +
        'walletCurrencies data file', () => {
        expect(
          isSupportedWalletCur('NOT-CLIENT-SUPPORTED', {
            clientSupported: true,
            serverCurs: [currencies[0].code, 'NOT-CLIENT-SUPPORTED'],
          })
        ).deep.equal(false);
      });
    });

    describe('has a onlySupportedWalletCurs function that takes a list of currencies', () => {
      it('and returns only the ones that are supported wallet currencies', () => {
        expect(
          onlySupportedWalletCurs(['HI', 'THERE', 'SLICK', 'WILLY'], {
            clientSupported: false,
            serverCurs: ['HI', 'THERE', 'WILLY'],
          })
        ).deep.equal(['HI', 'THERE', 'WILLY']);
      });

      it('and returns an empty list if none of them are supported wallet ' +
        'currencies', () => {
        expect(
          onlySupportedWalletCurs(['HI', 'THERE', 'SLICK', 'WILLY'], {
            clientSupported: false,
            serverCurs: ['BTC', 'ZEC', 'LTC'],
          })
        ).deep.equal([]);
      });

      it('and returns only the ones that are supported wallet currencies ' +
        'factoring in client support if "true" is passed in for the ' +
        'clientSupported option', () => {
        const curs = currencies.map(cur => cur.code);
        expect(
          onlySupportedWalletCurs([...curs, 'NO-SOUP-FOR-YOU'], {
            clientSupported: true,
            serverCurs: [...curs],
          })
        ).deep.equal([...curs]);
      });
    });

    describe('has a anySupportedByWallet function that takes a list of currencies', () => {
      it('and returns true if any of them are supported wallet currencies', () => {
        expect(
          anySupportedByWallet(['WIGGLES', 'YES', 'HI', 'NO'], {
            clientSupported: false,
            serverCurs: ['HI', 'THERE', 'WILLY'],
          })
        ).deep.equal(true);
      });

      it('and returns false if none of them are supported wallet currencies', () => {
        expect(
          anySupportedByWallet(['WIGGLES', 'YES', 'TRUST', 'NO'], {
            clientSupported: false,
            serverCurs: ['HI', 'THERE', 'WILLY'],
          })
        ).deep.equal(false);
      });

      it('and returns true if any of them are supported wallet currencies ' +
        'factoring in client support if "true" is passed in for the ' +
        'clientSupported option', () => {
        const curs = currencies.map(cur => cur.code);
        expect(
          anySupportedByWallet([curs[0], 'NO', 'MO', 'PICKLES'], {
            clientSupported: true,
            serverCurs: [...curs],
          })
        ).deep.equal(true);
      });

      it('and returns false if none of them are supported wallet currencies ' +
        'factoring in client support if "true" is passed in for the ' +
        'clientSupported option', () => {
        expect(
          anySupportedByWallet(['NO-SOUP-FOR-YOU'], {
            clientSupported: true,
            serverCurs: ['NO-SOUP-FOR-YOU'],
          })
        ).deep.equal(false);
      });
    });
  }
});
