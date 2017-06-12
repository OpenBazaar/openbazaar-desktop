import { integerToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';
import Contract from './Contract';
import Transactions from '../../collections/order/Transactions';
import Transaction from '../../models/order/Transaction';
import app from '../../app';

export default class extends BaseModel {
  constructor(attrs, options) {
    const opts = {
      type: 'sale',
      ...options,
    };

    const types = ['sale', 'purchase'];

    if (types.indexOf(opts.type) === -1) {
      throw new Error(`Type needs to be one of ${types}.`);
    }

    super(attrs, opts);
    this.type = opts.type;
  }

  url() {
    return app.getServerUrl(`ob/order/${this.id}`);
  }

  get idAttribute() {
    return 'orderId';
  }

  get nested() {
    return {
      contract: Contract,
      paymentAddressTransactions: Transactions,
      refundAddressTransaction: Transaction,
    };
  }

  parse(response = {}) {
    if (response.contract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawContract = JSON.parse(JSON.stringify(response.contract)); // deep clone

      // convert price fields
      response.contract.buyerOrder.payment.amount =
        integerToDecimal(response.contract.buyerOrder.payment.amount, true);
    }

    response.paymentAddressTransactions = response.paymentAddressTransactions || [];

    if (response.refundAddressTransaction && !response.refundAddressTransaction.txid) {
      // Before an actual refund is present, the refundAddressTransaction is set with
      // some dummy values. We'll just clear it out in that case since the lack of
      // that object is a clearer indicator that there is no refund.
      delete response.refundAddressTransaction;
    }

    return response;
  }
}
