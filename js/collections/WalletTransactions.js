import app from '../app';
import { Collection } from 'backbone';
import Transaction from '../models/wallet/Transaction';

export default class extends Collection {
  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  url() {
    return app.getServerUrl('wallet/transactions/');
  }

  modelId(attrs) {
    return attrs.txid;
  }

  parse(response) {
    console.log('billy beamer');
    window.billy = response;
    response.transactions = response.transactions || [];
    return response.transactions;
  }
}
