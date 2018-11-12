import $ from 'jquery';
import app from '../../../../app';
import {
  acceptingOrder,
  acceptOrder,
  rejectingOrder,
  rejectOrder,
  cancelingOrder,
  cancelOrder,
  events as orderEvents,
} from '../../../../utils/order';
import { getCurrencyByCode as getWalletCurByCode } from '../../../../data/walletCurrencies';
import { checkValidParticipantObject } from '../OrderDetail.js';
import baseVw from '../../../baseVw';
import Payment from './Payment';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      isCrypto: false,
      ...options,
    };

    if (!options.orderId) {
      throw new Error('Please provide the order id.');
    }

    if (!options.collection) {
      throw new Error('Please provide a transactions collection.');
    }

    if (typeof options.orderPrice !== 'number') {
      throw new Error('Please provide the price of the order.');
    }

    if (typeof options.isOrderCancelable !== 'function') {
      throw new Error('Please provide a function that returns whether this order can be canceled ' +
        'by the current user.');
    }

    if (typeof options.isOrderConfirmable !== 'function') {
      throw new Error('Please provide a function that returns whether this order can be ' +
        'confirmed by the current user.');
    }

    checkValidParticipantObject(options.vendor, 'vendor');

    super(opts);
    this.options = opts;
    this.orderId = this.options.orderId;
    this.payments = [];

    try {
      this.paymentCoinData = getWalletCurByCode(this.options.paymentCoin);
    } catch (e) {
      throw new Error(`No wallet currency data is available for ${this.options.paymentCoin}`);
    }

    this.listenTo(this.collection, 'update', () => this.render());
    this.listenTo(orderEvents, 'cancelingOrder', this.onCancelingOrder);
    this.listenTo(orderEvents, 'cancelOrderComplete, cancelOrderFail',
      this.onCancelOrderAlways);
    this.listenTo(orderEvents, 'cancelOrderComplete', this.onAcceptOrderComplete);
    this.listenTo(orderEvents, 'acceptingOrder', this.onAcceptingOrder);
    this.listenTo(orderEvents, 'acceptOrderComplete acceptOrderFail',
      this.onAcceptOrderAlways);
    this.listenTo(orderEvents, 'acceptOrderComplete', this.onAcceptOrderComplete);
    this.listenTo(orderEvents, 'rejectingOrder', this.onRejectingOrder);
    this.listenTo(orderEvents, 'rejectOrderComplete rejectOrderFail',
      this.onRejectOrderAlways);
    this.listenTo(orderEvents, 'rejectOrderComplete', this.onRejectOrderComplete);
  }

  className() {
    return 'payments';
  }

  onCancelClick() {
    cancelOrder(this.orderId);
  }

  onCancelingOrder(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ cancelInProgress: true });
    }
  }

  onCancelOrderAlways(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ cancelInProgress: false });
    }
  }

  onCancelOrderComplete(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ showCancelButton: false });
    }
  }

  onAcceptClick() {
    acceptOrder(this.orderId);
  }

  onAcceptingOrder(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ acceptInProgress: true });
    }
  }

  onAcceptOrderAlways(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ acceptInProgress: false });
    }
  }

  onAcceptOrderComplete(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ showAcceptButton: false });
    }
  }

  onRejectClick() {
    rejectOrder(this.orderId);
  }

  onRejectingOrder(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ rejectInProgress: true });
    }
  }

  onRejectOrderAlways(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ rejectInProgress: false });
    }
  }

  onRejectOrderComplete(e) {
    if (e.id === this.orderId) {
      this.payments[this.payments.length - 1].setState({ showRejectButton: false });
    }
  }

  createPayment(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const payment = this.createChild(Payment, {
      ...options,
      model,
      initialState: {
        ...options.initialState,
      },
    });

    this.listenTo(payment, 'cancelClick', this.onCancelClick);
    this.listenTo(payment, 'acceptClick', this.onAcceptClick);
    this.listenTo(payment, 'confirmedRejectClick', this.onRejectClick);
    this.payments.push(payment);

    return payment;
  }

  render() {
    const paymentsContainer = document.createDocumentFragment();

    this.payments.forEach(payment => (payment.remove()));
    this.payments = [];

    this.collection.models.forEach((payment, index) => {
      let paidSoFar = this.collection.models
        .slice(0, index + 1)
        .reduce((total, model) => total + model.get('value'), 0);
      // round based on the coins base units
      const cryptoBaseUnit = this.paymentCoinData.baseUnit;
      paidSoFar = Math.round(paidSoFar * cryptoBaseUnit) / cryptoBaseUnit;
      const isMostRecentPayment = index === this.collection.length - 1;
      const paymentView = this.createPayment(payment, {
        initialState: {
          paymentNumber: index + 1,
          amountShort: this.options.orderPrice - paidSoFar,
          showAcceptRejectButtons: isMostRecentPayment && this.options.isOrderConfirmable(),
          showCancelButton: isMostRecentPayment && this.options.isOrderCancelable(),
          cancelInProgress: cancelingOrder(this.orderId),
          acceptInProgress: acceptingOrder(this.orderId),
          rejectInProgress: rejectingOrder(this.orderId),
          isCrypto: this.options.isCrypto,
          paymentCoin: this.options.paymentCoin,
          blockChainTxUrl: this.paymentCoinData
            .getBlockChainTxUrl(payment.id, app.serverConfig.testnet),
        },
      });

      $(paymentsContainer).prepend(paymentView.render().el);
    });

    if (this.payments.length) {
      this.options.vendor.getProfile()
        .done(profile => {
          this.payments.forEach(payment => payment.setState({ payee: profile.get('name') || '' }));
        });
    }

    this.$el.empty()
      .append(paymentsContainer);

    return this;
  }
}
