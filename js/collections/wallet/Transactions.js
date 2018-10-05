import app from '../../app';
import { Collection } from 'backbone';
import Transaction from '../../models/wallet/Transaction';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (typeof options.coinType !== 'string') {
      throw new Error('Please provide a coinType as a string.');
    }

    super(models, options);
    this.options = options;
  }

  model(attrs, options) {
    return new Transaction(attrs, {
      coinType: options.collection.options.coinType,
      ...options,
    });
  }

  url() {
    return app.getServerUrl(`wallet/transactions/${this.options.coinType}`);
  }

  modelId(attrs) {
    return attrs.txid;
  }

  parse(response) {
    response.transactions = response.transactions || [];
    return response.transactions;
  }
}
