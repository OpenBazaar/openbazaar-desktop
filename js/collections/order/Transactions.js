import { Collection } from 'backbone';
import Transaction from '../../models/order/Transaction';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (typeof options.paymentCoin !== 'string' || !options.paymentCoin) {
      throw new Error('Please provide a paymentCoin');
    }

    return super(models, options);
  }

  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  modelId(attrs) {
    return attrs.txid;
  }
}
