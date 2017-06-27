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

      if (response.contract.disputeResolution) {
        response.contract.disputeResolution.payout.buyerOutput =
          response.contract.disputeResolution.payout.buyerOutput || {};
        response.contract.disputeResolution.payout.vendorOutput =
          response.contract.disputeResolution.payout.vendorOutput || {};
        response.contract.disputeResolution.payout.moderatorOutput =
          response.contract.disputeResolution.payout.moderatorOutput || {};

        // Temporary to account for server bug:
        // https://github.com/OpenBazaar/openbazaar-go/issues/548
        // Sometimes the payment amounts are coming back as enormously inflated strings.
        // For now, we'll just make them dummy values.
        if (typeof response.contract.disputeResolution.payout.buyerOutput.amount === 'string') {
          response.contract.disputeResolution.payout.buyerOutput.amount = 25000;
        }

        if (typeof response.contract.disputeResolution.payout.vendorOutput.amount === 'string') {
          response.contract.disputeResolution.payout.vendorOutput.amount = 12000;
        }

        if (typeof response.contract.disputeResolution.payout.moderatorOutput.amount === 'string') {
          response.contract.disputeResolution.payout.moderatorOutput.amount = 6000;
        }

        response.contract.disputeResolution.payout.buyerOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.buyerOutput.amount || 0, true);
        response.contract.disputeResolution.payout.vendorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.vendorOutput.amount || 0, true);
        response.contract.disputeResolution.payout.moderatorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.moderatorOutput.amount || 0, true);
      }
    }

    response.paymentAddressTransactions = response.paymentAddressTransactions || [];

    return response;
  }
}
