import app from '../../app';
import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      confirmations: 0,
      height: 0,
      canBumpFee: true,
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

      if (height === -1) {
        attrs.status = 'DEAD';
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) <= stuckTime) {
        attrs.status = 'UNCONFIRMED';
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) > stuckTime) {
        attrs.status = 'STUCK';
      } else if (confirmations > 0 && confirmations <= 6) {
        attrs.status = 'PENDING';
      } else if (confirmations > 6) {
        attrs.status = 'CONFIRMED';
      }

      if (height !== 0) {
        attrs.canBumpFee = false;
      }
    }

    return super.set(attrs, opts);
  }

  parse(response = {}) {
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
      if (returnVal.memo.startsWith('Fee bump of ')) {
        returnVal.translatedMemo = app.polyglot.t('wallet.transactions.transaction.feeBumpOf',
          { address: returnVal.memo.slice(12) });
      }

      returnVal = {
        ...returnVal,
        // Convert satoshi to BTC
        value: integerToDecimal(returnVal.value, true),
      };
    }

    return returnVal;
  }
}
