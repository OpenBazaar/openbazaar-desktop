import app from '../../app';
import bigNumber from 'bignumber.js';
import { integerToDecimal, curDefToDecimal } from '../../utils/currency';
import { getCurrencyByCode as getWalletCurByCode } from '../../data/walletCurrencies';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  constructor(attrs = {}, options = {}) {
    if (!options.coinType || typeof options.coinType !== 'string') {
      throw new Error('Please provide a coinType as a non-empty string.');
    }

    super(attrs, options);
    this.options = options;
  }

  defaults() {
    return {
      confirmations: 0,
      height: 0,
      feeBumped: false,
      allowFeeBump: false,
      memo: '',
    };
  }

  get idAttribute() {
    return 'txid';
  }

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val;
    } else {
      (attrs = {})[key] = val;
    }

    // set is called internally by Backbone before the contructor is complete, so
    // this.options might not be there. But... Backbone also passes in the constructor
    // options, when calling set from the constructor.
    const coinType = this.options ? this.options.coinType : opts.coinType;

    if (
      attrs.confirmations !== this.attributes.confirmations ||
      attrs.timestamp !== this.attributes.timestamp ||
      attrs.height !== this.attributes.height) {
      const confirmations = attrs.confirmations === undefined ?
        this.attributes.confirmations : attrs.confirmations;
      const timestamp = attrs.timestamp === undefined ?
        this.attributes.timestamp : attrs.timestamp;
      const height = attrs.height === undefined ?
        this.attributes.height : attrs.height;
      const stuckTime = 1000 * 60 * 60 * 6; // 6 hours
      let walletCurData;

      try {
        walletCurData = getWalletCurByCode(coinType);
      } catch (e) {
        // pass
      }

      if (height === -1) {
        attrs.status = 'DEAD';
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) <= stuckTime) {
        attrs.status = 'UNCONFIRMED';
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) > stuckTime) {
        attrs.status = 'STUCK';
        attrs.allowFeeBump = !attrs.feeBumped && attrs.value > 0 &&
          walletCurData && typeof walletCurData.feeBumpTransactionSize === 'number';
      } else if (confirmations > 0 && confirmations <= 5) {
        attrs.status = 'PENDING';
      } else if (confirmations > 5) {
        attrs.status = 'CONFIRMED';
      }
    }

    return super.set(attrs, opts);
  }

  parse(response = {}, options = {}) {
    let returnVal = { ...response };

    // The client will in set() manage the status attribute. The reason is that
    // this is dependant on the confirmation count which is
    // updated on the client side based on block height obtained from the walletUpdate
    // socket. This allows us to centralize the logic and avoid having the client match
    // the logic of the server (which is relatively arbitrary).
    delete returnVal.status;

    if (returnVal.transactions) {
      // this response is coming from the collection, we'll
      // do nothing and let the collection handle it.
    } else {
      if (returnVal.memo && returnVal.memo.startsWith('Fee bump of ')) {
        returnVal.translatedMemo = app.polyglot.t('wallet.transactions.transaction.feeBumpOf',
          { address: returnVal.memo.slice(12) });
      }

      const coinType = this.options ? this.options.coinType : options.coinType;
      let value = bigNumber();

      if (typeof returnVal.value === 'string') {
        try {
          value = integerToDecimal(
            returnVal.value,
            getWalletCurByCode(coinType).coinDivisibility,
            { returnNaNOnError: false }
          );
        } catch (e) {
          console.error(`Unable to convert the ${coinType} transaction value from base ` +
            `units: ${e.message}`);
        }
      } else if (typeof returnVal.value === 'object') {
        // If the data is coming from the API, the value will be a string and we get the
        // divisibility from the wallet urrency definition. If the data comes from the socket
        // it will be an object containing a fulll currency definition with its own divisibibility.
        // The server hopes to clean up this inconsistency at some point.
        value = curDefToDecimal(returnVal.value);
      }

      returnVal = {
        ...returnVal,
        value,
      };

      // The UI has more stringent logic to determine when fee bumping is possible. This model will
      // provide a allowFeeBump flag to indicate when it's allowed. The canBumpFee flag from the
      // server is just used to determine whether the fee was already bumped or not.
      returnVal.feeBumped = typeof value === 'number' ?
        (returnVal.value > 0 && !returnVal.canBumpFee) : false;
      delete returnVal.canBumpFee;
    }

    return returnVal;
  }
}
