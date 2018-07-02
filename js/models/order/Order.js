import { getServerCurrency } from '../../data/cryptoCurrencies';
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

  /**
   * Returns a boolean indicating whether the vendor had an error when processing
   * the order. This is different from just checking for the PROCESSING_ERROR state,
   * in that it will return true even after the order moves on from that state.
   */
  get vendorProcessingError() {
    const contract = this.get('contract');
    return contract && Array.isArray(contract.get('errors'));
  }

  parse(response = {}) {
    const serverCur = getServerCurrency();

    if (response.contract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawContract = JSON.parse(JSON.stringify(response.contract)); // deep clone

      // convert price fields
      response.contract.buyerOrder.payment.amount =
        integerToDecimal(response.contract.buyerOrder.payment.amount,
          app.serverConfig.cryptoCurrency);

      // convert crypto listing quantities
      response.contract.buyerOrder.items.forEach((item, index) => {
        const listing = response.contract
          .vendorListings[index];

        // standardize the quantity field
        item.quantity = item.quantity === 0 ?
          item.quantity64 : item.quantity;

        if (listing.metadata.contractType === 'CRYPTOCURRENCY') {
          const coinDivisibility = listing.metadata
            .coinDivisibility;

          item.quantity = item.quantity / coinDivisibility;
        }
      });

      if (response.contract.disputeResolution) {
        response.contract.disputeResolution.payout.buyerOutput =
          response.contract.disputeResolution.payout.buyerOutput || {};
        response.contract.disputeResolution.payout.vendorOutput =
          response.contract.disputeResolution.payout.vendorOutput || {};
        response.contract.disputeResolution.payout.moderatorOutput =
          response.contract.disputeResolution.payout.moderatorOutput || {};

        response.contract.disputeResolution.payout.buyerOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.buyerOutput.amount || 0,
              app.serverConfig.cryptoCurrency);
        response.contract.disputeResolution.payout.vendorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.vendorOutput.amount || 0,
              app.serverConfig.cryptoCurrency);
        response.contract.disputeResolution.payout.moderatorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.moderatorOutput.amount || 0,
              app.serverConfig.cryptoCurrency);
      }
    }

    response.paymentAddressTransactions = response.paymentAddressTransactions || [];

    // Embed the payment type into each payment transaction.
    // TODO: when multi wallet payment support is implemented, this will need to come
    // from the server.
    const payments = [...response.paymentAddressTransactions];

    if (response.refundAddressTransaction) {
      payments.push(response.refundAddressTransaction);
    }

    payments.forEach(pmt => (pmt.paymentCoin = serverCur.code));

    return response;
  }
}
