import _ from 'underscore';
import { Collection } from 'backbone';
import { integerToDecimal } from '../../utils/currency';
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

  set(key, val, options = {}) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    let paymentCoin = this.paymentCoin;

    if (!paymentCoin) {
      try {
        paymentCoin = attrs.contract.buyerOrder.payment.coin;
      } catch (e) {
        // pass
      }
    }

    if (!opts.unset) {
      const transactionFields = [
        'paymentAddressTransactions',
        'refundAddressTransaction',
      ];

      transactionFields.forEach(field => {
        if (
          attrs[field] &&
          !(attrs[field] instanceof Collection) &&
          !this.attributes[field] &&
          paymentCoin
        ) {
          // If setting a transactions field for the first time, we'll
          // instantiate the collection so that we could pass in the paymentCoin.
          // The expectation is that the data required to determine the paymentCoin
          // will already be set on the model or provided in the attrs passed into
          // this set() call.
          attrs[field] = new Transactions(attrs[field], {
            paymentCoin,
            parse: true,
          });
        }
      });
    }

    return super.set(attrs, opts);
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
    const paymentCoinData = this.paymentCoinData;
    let balanceRemaining = this.orderPrice - this.totalPaid;

    // console.log(`the order price is ${this.orderPrice}`);
    // console.log(`the total paid is ${this.orderPrice}`);
    // console.log(`the balance remaining is ${balanceRemaining}`);
    // console.log(`slip diddly doo`);
    window.slip = this;

    if (paymentCoinData) {
      // round based on the coins base units
      const cryptoBaseUnit = paymentCoinData.baseUnit;
      balanceRemaining = Math.round(balanceRemaining * cryptoBaseUnit) / cryptoBaseUnit;
    }

    return balanceRemaining;
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
      const transactions = new Transactions(
        models.slice(0, pIndex + 1),
        { paymentCoin: this.paymentCoin }
      );
      if (this.getBalanceRemaining(transactions) <= 0) {
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
        .filter(payment => (payment.get('value') > 0)),
      { paymentCoin: this.paymentCoin }
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
    const paymentCoin = BaseOrder.paymentCoin;

    if (response.contract) {
      // Since we modify the data on parse (particularly in some nested models),
      // we'll store the original contract here.
      response.rawContract = JSON.parse(JSON.stringify(response.contract)); // deep clone

      const payment = response.contract.buyerOrder.payment;
      // convert price fields
      response.contract.buyerOrder.payment.amount =
        integerToDecimal(payment.amount, payment.coin);

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
              paymentCoin);
        response.contract.disputeResolution.payout.vendorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.vendorOutput.amount || 0,
              paymentCoin);
        response.contract.disputeResolution.payout.moderatorOutput.amount =
          integerToDecimal(
            response.contract.disputeResolution.payout.moderatorOutput.amount || 0,
              paymentCoin);
      }
    }

    response.paymentAddressTransactions = response.paymentAddressTransactions || [];

    const payments = [...response.paymentAddressTransactions];

    if (response.refundAddressTransaction) {
      payments.push(response.refundAddressTransaction);
    }

    return response;
  }
}
