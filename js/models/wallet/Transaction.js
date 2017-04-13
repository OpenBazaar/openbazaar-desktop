import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      confirmations: 0,
      height: -1,
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
      const stuckTime = 6 * 60 * 60 * 100; // 6 hours

      if (height === -1) {
        attrs.status = 'DEAD';
        attrs.canBumpFee = false;
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) <= stuckTime) {
        attrs.status = 'UNCONFIRMED';
        attrs.canBumpFee = true;
      } else if (confirmations === 0 && (Date.now() - new Date(timestamp).getTime()) > stuckTime) {
        attrs.status = 'STUCK';
        attrs.canBumpFee = true;
      } else if (confirmations > 0 && confirmations <= 6) {
        attrs.status = 'PENDING';
        attrs.canBumpFee = true;
      } else if (confirmations > 6) {
        attrs.status = 'CONFIRMED';
        attrs.canBumpFee = false;
      }
    }

    return super.set(attrs, opts);
  }

  parse(response = {}) {
    let returnVal = response;

    // The client will in set() will create it's own status and canBumpFee attributes.
    // The reason is that these are dependant on the confirmation count which is
    // updated on the client side based on block height obtained from the walletUpdate
    // socket. This allows us to avoid having the client match the logic of the server (which
    // is quite arbitrary) and remain in sync with it.
    delete returnVal.status;
    delete returnVal.canBumpFee;

    if (response.transactions) {
      // this response is coming from the collection, we'll
      // do nothing and let the collection handle it.
    } else {
      returnVal = {
        // Convert satoshi to BTC
        value: integerToDecimal(response.value, true),
        ...response,
      };
    }

    return returnVal;
  }
}
