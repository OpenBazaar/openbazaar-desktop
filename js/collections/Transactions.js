// used for sales, purchases and cases
import app from '../app';
import { Collection } from 'backbone';
import Transaction from '../models/Transaction';
import $ from 'jquery';

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

  // temporary to test pagination with dummy data
  get rawPurchase() {
    return {
      orderId: 'QmRLMNcmb7SXz3zrYZM6zuvSvhHSnyuxnAi4EAxZBpnQdD',
      read: true,
      shippingAddress: '1500 W. Taylor',
      shippingName: 'Big Papi',
      state: 'CONFIRMED',
      thumbnail: 'QmdEqHjwWNzoTEjTuRy8ykLM2zpgW8mDbmJDJS9nN89eT1',
      timestamp: '2017-04-25T09:28:20-07:00',
      title: 'try again',
      total: 156606,
      unreadChatMessages: 0,
      vendorHandle: '',
      vendorId: 'QmbSYKcypVVZNVQ4tqgG6oE8kNBapjgoU5676fBp62hcWE',
    };
  }

  // temporary to test pagination with dummy data
  fetch() {
    const deferred = $.Deferred();
    const queryTotal = 16;
    const perPage = 5;

    setTimeout(() => {
      const models = [];
      const remaining = queryTotal - this.length > perPage ?
        perPage : queryTotal - this.length;

      for (let i = 0; i < remaining; i++) {
        const md = new Transaction({
          ...this.rawPurchase,
          orderId: `${this.length + i + 1}---${this.rawPurchase.orderId.slice(5)}`,
        }, { parse: true });
        models.push(md);
      }

      this.add(models);
      deferred.resolve({ queryCount: queryTotal });
    }, 1000);

    return deferred.promise();
  }

  modelId(attrs) {
    return attrs.orderId;
  }

  parse(response) {
    return response[this.type];
  }
}
