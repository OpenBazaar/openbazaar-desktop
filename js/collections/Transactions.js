// used for sales, purchases and cases
import app from '../app';
import { Collection } from 'backbone';
import Transaction from '../models/Transaction';

export default class extends Collection {
  constructor(models = [], options = {}) {
    const opts = {
      type: 'sales',
      ...options,
    };

    const types = ['sales', 'purchases', 'cases'];

    if (types.indexOf(opts.type) === -1) {
      throw new Error(`Type needs to be one of ${types}.`);
    }

    super(models, opts);
    this.type = opts.type;
  }

  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  url() {
    return app.getServerUrl(`ob/${this.type}`);
  }

  modelId(attrs) {
    return attrs.orderId;
  }
}
