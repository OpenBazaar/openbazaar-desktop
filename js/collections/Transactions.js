import app from '../app';
import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import Transaction from '../models/wallet/Transaction';

export default class extends Collection {
  model(attrs, options) {
    return new Transaction(attrs, options);
  }

  url() {
    return app.getServerUrl('wallet/transactions/');
  }

  parse(response) {
    response.transactions.forEach(transaction => {
      transaction.value = integerToDecimal(transaction.value, true);
    });

    return response.transactions;
  }
}
