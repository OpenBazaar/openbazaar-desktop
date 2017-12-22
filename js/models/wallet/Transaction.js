import app from '../../app';
import { integerToDecimal } from '../../utils/currency';
import { getServerCurrency } from '../../data/cryptoCurrencies';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
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
        attrs.allowFeeBump = !attrs.feeBumped && attrs.value > 0 &&
          typeof getServerCurrency().feeBumpTransactionSize === 'number';
      } else if (confirmations > 0 && confirmations <= 5) {
        attrs.status = 'PENDING';
      } else if (confirmations > 5) {
        attrs.status = 'CONFIRMED';
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
      if (returnVal.memo && returnVal.memo.startsWith('Fee bump of ')) {
        returnVal.translatedMemo = app.polyglot.t('wallet.transactions.transaction.feeBumpOf',
          { address: returnVal.memo.slice(12) });
      }

      // The UI has more stringent logic to determine when fe bumping is possible. This model will
      // provide a allowFeeBump flag to indicate when it's allowed. The canBumpFee flag from the
      // server is just used to determine whether the fee was already bumped or not.
      returnVal.feeBumped = returnVal.value > 0 && !returnVal.canBumpFee;
      delete returnVal.canBumpFee;

      returnVal = {
        ...returnVal,
        // Convert from base units
        value: integerToDecimal(returnVal.value,
          app.serverConfig.cryptoCurrency),
      };
    }

    return returnVal;
  }
}
