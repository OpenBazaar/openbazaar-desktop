// used for sales, purchases and cases
import app from '../app';
import { Collection } from 'backbone';
import Transaction from '../models/transaction/Transaction';
import Case from '../models/transaction/Case';

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

  model(attrs) {
    const Md = attrs.caseId ? Case : Transaction;
    return new Md(attrs, { parse: true });
  }

  modelId(attrs) {
    return this.type === 'cases' ? attrs.caseId : attrs.orderId;
  }

  url() {
    return app.getServerUrl(`ob/${this.type}`);
  }

  fetch(options = {}) {
    return super.fetch({
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      ...options,
      data: JSON.stringify(options.data || {}),
    });
  }

  parse(response) {
    return response[this.type] || [];
  }
}
