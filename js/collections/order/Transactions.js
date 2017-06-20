import { Collection } from 'backbone';
import Transaction from '../../models/order/Transaction';

export default class extends Collection {
  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  modelId(attrs) {
    return attrs.txid;
  }
}
