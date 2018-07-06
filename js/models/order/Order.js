import _ from 'underscore';
import { integerToDecimal } from '../../utils/currency';
import { getServerCurrency } from '../../data/cryptoCurrencies';
import app from '../../app';
import BaseOrder from './BaseOrder';
import Contract from './Contract';
import Transactions from '../../collections/order/Transactions';
import Transaction from '../../models/order/Transaction';

export default class extends BaseOrder {
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

  get contract() {
    return this.get('contract');
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

  get orderPrice() {
    return this.contract.get('buyerOrder').payment.amount;
  }

  get totalPaid() {
    return this.paymentsIn
      .reduce((total, transaction) => total + transaction.get('value'), 0);
  }

  getBalanceRemaining() {
    const balanceRemaining = this.orderPrice - this.totalPaid;

    // round based on the coins base units
    const cryptoBaseUnit = getServerCurrency().baseUnit;
    return Math.round(balanceRemaining * cryptoBaseUnit) / cryptoBaseUnit;
  }

  get isPartiallyFunded() {
    const balanceRemaining = this.getBalanceRemaining();
    return balanceRemaining > 0 && balanceRemaining < this.orderPrice;
  }

  /**
   * Returns a boolean indicating whether the order has been partially or fully
   * funded.
   */
  get isFunded() {
    return this.isPartiallyFunded || this.getBalanceRemaining() === 0;
  }

  /**
   * Returns the block height in which this order became fully funded. If the order is
   * not fully funded or the transaction(s) that would make it fully funded haven't
   * confirmed, it will return 0.
   */
  get fundedBlockHeight() {
    let height = 0;

    const models = this.paymentsIn
      .filter(payment => {
        const paymentHeight = payment.get('height');
        return typeof paymentHeight === 'number' && paymentHeight > 0;
      })
      .sort((a, b) => (a.get('height') - b.get('height')));

    _.every(models, (payment, pIndex) => {
      if (this.getBalanceRemaining(new Transactions(models.slice(0, pIndex + 1))) <= 0) {
        height = payment.get('height');
        return false;
      }

      return true;
    });

    return height;
  }

  /**
   * Returns a modified version of the transactions by filtering out any negative payments
   * (e.g. money moving from the multisig to the vendor, refunds).
   */
  get paymentsIn() {
    return new Transactions(
      this.get('paymentAddressTransactions')
        .filter(payment => (payment.get('value') > 0))
      );
  }

  get isOrderCancelable() {
    return this.buyerId === app.profile.id &&
      !this.moderatorId &&
      ['PROCESSING_ERROR', 'PENDING'].includes(this.get('state')) &&
      this.isFunded;
  }

  get isOrderDisputable() {
    const orderState = this.get('state');

    if (this.buyerId === app.profile.id) {
      return this.moderatorId &&
        (
          ['AWAITING_FULFILLMENT', 'PENDING', 'FULFILLED'].includes(orderState) ||
          (orderState === 'PROCESSING_ERROR' && this.isFunded)
        );
    } else if (this.vendorId === app.profile.id) {
      return this.moderatorId &&
        ['PARTIALLY_FULFILLED', 'FULFILLED'].includes(orderState);
    }

    return false;
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
