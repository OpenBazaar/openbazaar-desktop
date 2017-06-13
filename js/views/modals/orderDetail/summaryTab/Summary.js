import $ from 'jquery';
import app from '../../../../app';
import { clipboard } from 'electron';
import '../../../../utils/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import { getSocket } from '../../../../utils/serverConnect';
import {
  events as orderEvents,
} from '../../../../utils/order';
import Transactions from '../../../../collections/Transactions';
import OrderCompletion from '../../../../models/order/orderCompletion/OrderCompletion';
import BaseVw from '../../../baseVw';
import StateProgressBar from './StateProgressBar';
import Payments from './Payments';
import Accepted from './Accepted';
import Fulfilled from './Fulfilled';
import Refunded from './Refunded';
import OrderDetails from './OrderDetails';
import CompleteOrderForm from './CompleteOrderForm';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    let contract;

    if (!this.isCase()) {
      contract = this.model.get('contract');
    } else {
      contract = this.model.get('buyerOpened') ?
        this.model.get('buyerContract') :
        this.model.get('vendorContract');
    }

    this.contract = contract;

    const isValidParticipantObject = (participant) => {
      let isValid = true;
      if (!participant.id) isValid = false;
      if (typeof participant.getProfile !== 'function') isValid = false;
      return isValid;
    };

    const getInvalidParticpantError = (type = '') =>
      (`The ${type} object is not valid. It should have an id ` +
        'as well as a getProfile function that returns a promise that ' +
        'resolves with a profile model.');

    if (!opts.vendor) {
      throw new Error('Please provide a vendor object.');
    }

    if (!isValidParticipantObject(options.vendor)) {
      throw new Error(getInvalidParticpantError('vendor'));
    }

    if (!opts.buyer) {
      throw new Error('Please provide a buyer object.');
    }

    if (!isValidParticipantObject(options.buyer)) {
      throw new Error(getInvalidParticpantError('buyer'));
    }

    if (this.contract.get('buyerOrder').payment.moderator) {
      if (!options.moderator) {
        throw new Error('Please provide a moderator object.');
      }

      if (!isValidParticipantObject(options.moderator)) {
        throw new Error(getInvalidParticpantError('moderator'));
      }
    }

    this.options = opts || {};
    this.vendor = opts.vendor;
    this.buyer = opts.buyer;
    this.moderator = opts.moderator;

    this.listenTo(this.model, 'change:state', (md, state) => {
      this.stateProgressBar.setState(this.progressBarState);
      if (this.payments) this.payments.render();
      if (this.shouldShowAcceptedSection()) {
        if (!this.accepted) this.renderAcceptedView();
      } else {
        if (this.accepted) this.accepted.remove();
      }

      if (state === 'REFUNDED' && this.accepted) {
        this.accepted.setState({
          showRefundButton: false,
          showFulfillButton: false,
          infoText: app.polyglot.t('orderDetail.summaryTab.accepted.vendorReceived'),
        });
      }
    });

    if (!this.isCase()) {
      this.listenTo(this.model.get('paymentAddressTransactions'), 'update', () => {
        if (!this.shouldShowPayForOrderSection()) {
          this.$('.js-payForOrderWrap').remove();
        }

        if (this.payments) {
          this.payments.collection.set(this.paymentsCollection.models);
        }
      });

      this.listenTo(this.model, 'change:refundAddressTransaction',
        () => this.renderRefundView());
    }

    this.listenTo(orderEvents, 'cancelOrderComplete', () => {
      this.model.set('state', 'CANCELED');
      // we'll refetch so our transaction list is updated with
      // the money returned to the buyer
      this.model.fetch();
    });

    this.listenTo(orderEvents, 'acceptOrderComplete', () => {
      // todo: factor in AWAITING_PICKUP
      this.model.set('state', 'AWAITING_FULFILLMENT');

      // we'll refetch so we get our vendorOrderConfirmation object
      this.model.fetch();
    });

    this.listenTo(orderEvents, 'rejectOrderComplete', () => {
      this.model.set('state', 'DECLINED');

      // We'll refetch so our transaction list is updated with
      // the money returned to the buyer (if they're online). If they're
      // not online the refund shows up when the buyer comes back online.
      this.model.fetch();
    });

    this.listenTo(this.contract, 'change:vendorOrderConfirmation',
      () => this.renderAcceptedView());

    this.listenTo(orderEvents, 'fulfillOrderComplete', e => {
      if (e.id === this.model.id && this.accepted) {
        this.model.set('state', 'FULFILLED');
        this.model.fetch();
      }
    });

    this.listenTo(orderEvents, 'refundOrderComplete', e => {
      if (e.id === this.model.id) {
        this.model.set('state', 'REFUNDED');
        this.model.fetch();
      }
    });

    this.listenTo(this.contract, 'change:vendorOrderFulfillment',
      () => this.renderFulfilledView());

    const serverSocket = getSocket();

    if (serverSocket) {
      serverSocket.on('message', e => {
        if (e.jsonData.notification) {
          if (e.jsonData.notification.payment &&
            e.jsonData.notification.payment.orderId === this.model.id) {
            // A notification for the buyer that a payment has come in for the order. Let's refetch
            // our model so we have the data for the new transaction and can show it in the UI.
            // As of now, the buyer only gets these notifications and this is the only way to be
            // aware of partial payments in realtime.
            this.model.fetch();
          } else if (e.jsonData.notification.order &&
            e.jsonData.notification.order.orderId === this.model.id) {
            // A notification the vendor will get when an order has been fully funded
            this.model.fetch();
          } else if (e.jsonData.notification.orderCancel &&
            e.jsonData.notification.orderCancel.orderId === this.model.id) {
            // A notification the buyer will get when the vendor has rejected an offline order.
            this.model.fetch();
          } else if (e.jsonData.notification.orderConfirmation &&
            e.jsonData.notification.orderConfirmation.orderId === this.model.id) {
            // A notification the buyer will get when the vendor has accepted an offline order.
            this.model.fetch();
          } else if (e.jsonData.notification.refund &&
            e.jsonData.notification.refund.orderId === this.model.id) {
            // A notification the buyer will get when the vendor has refunded their order.
            this.model.fetch();
          } else if (e.jsonData.notification.orderFulfillment &&
            e.jsonData.notification.orderFulfillment.orderId === this.model.id) {
            // A notification the buyer will get when the vendor has fulfilled their order.
            this.model.fetch();
          }
        }
      });
    }
  }

  className() {
    return 'summaryTab';
  }

  events() {
    return {
      'click .js-copyOrderId': 'onClickCopyOrderId',
    };
  }

  onClickCopyOrderId() {
    clipboard.writeText(this.model.id);
    this.copiedToClipboardAnimatingIn = true;
    this.$copiedToClipboard
      .velocity('stop')
      .velocity('fadeIn', {
        complete: () => {
          this.$copiedToClipboard
            .velocity('fadeOut', { delay: 1000 });
        },
      });
  }

  isCase() {
    return typeof this.model.get('buyerOpened') !== 'undefined';
  }

  get $copiedToClipboard() {
    return this._$copiedToClipboard ||
      (this._$copiedToClipboard = this.$('.js-copiedToClipboard'));
  }

  get progressBarState() {
    const orderState = this.model.get('state');
    const state = {
      states: [
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.paid'),
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.accepted'),
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.fulfilled'),
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.complete'),
      ],
    };

    // TODO: add in completed check with determination of whether a dispute
    // had been opened.
    if (orderState === 'DISPUTED' || orderState === 'DECIDED' ||
      orderState === 'RESOLVED') {
      if (!this.isCase()) {
        state.states = [
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.disputed'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.decided'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.resolved'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.complete'),
        ];

        switch (orderState) {
          case 'DECIDED':
            state.currentState = 1;
            state.disputeState = 0;
            break;
          case 'RESOLVED':
            state.currentState = 2;
            state.disputeState = 0;
            break;
          case 'COMPLETE':
            state.currentState = 3;
            state.disputeState = 0;
            break;
          default:
            state.currentState = 1;
            state.disputeState = 1;
        }
      } else {
        state.states = [
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.disputed'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.complete'),
        ];

        switch (orderState) {
          case 'RESOLVED':
            state.currentState = 2;
            break;
          default:
            state.currentState = 1;
        }
      }
    } else if (orderState === 'DECLINED' || orderState === 'CANCELED' ||
      orderState === 'REFUNDED') {
      state.states = [
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.paid'),
        app.polyglot.t(
          `orderDetail.summaryTab.orderDetails.progressBarStates.${orderState.toLowerCase()}`),
      ];
      state.currentState = 2;
    } else {
      switch (orderState) {
        case 'PENDING':
          state.currentState = 1;
          break;
        case 'PARTIALLY_FULFILLED':
        case 'AWAITING_FULFILLMENT':
          state.currentState = 2;
          break;
        case 'FULFILLED':
        case 'AWAITING_PICKUP':
          state.currentState = 3;
          break;
        case 'COMPLETED':
          state.currentState = 4;
          break;
        default:
          state.currentState = 0;
      }
    }

    return state;
  }

  get orderPriceBtc() {
    return this.contract.get('buyerOrder').payment.amount;
  }

  getBalanceRemaining() {
    if (this.isCase()) {
      throw new Error('Cases do not have any transaction data.');
    }

    let balanceRemaining = 0;

    if (this.model.get('state') === 'AWAITING_PAYMENT') {
      const totalPaid = this.paymentsCollection
        .reduce((total, transaction) => total + transaction.get('value'), 0);
      balanceRemaining = this.orderPriceBtc - totalPaid;
    }

    return balanceRemaining;
  }

  shouldShowPayForOrderSection() {
    return this.buyer.id === app.profile.id && this.getBalanceRemaining() > 0;
  }

  shouldShowAcceptedSection() {
    let bool = false;

    // Show the accepted section if the order has been accepted and its fully funded.
    if (this.contract.get('vendorOrderConfirmation') && this.getBalanceRemaining() <= 0) {
      bool = true;
    }

    return bool;
  }

  get paymentAddress() {
    const vendorOrderConfirmation = this.contract.get('vendorOrderConfirmation');

    return vendorOrderConfirmation && vendorOrderConfirmation.paymentAddress ||
      this.contract.get('buyerOrder').payment.address;
  }

  /**
   * Returns a modified version of the transactions from the Order model by filtering out
   * any negative payments (money moving from the multisig to the vendor).
   */
  get paymentsCollection() {
    if (this.isCase()) {
      throw new Error('Transaction data is not available for cases.');
    }

    return new Transactions(
      this.model.get('paymentAddressTransactions')
        .filter(payment => (payment.get('value') > 0))
      );
  }

  renderAcceptedView() {
    const vendorOrderConfirmation = this.contract.get('vendorOrderConfirmation');

    if (!vendorOrderConfirmation) {
      throw new Error('Unable to create the accepted view because the vendorOrderConfirmation ' +
        'data object has not been set.');
    }

    const orderState = this.model.get('state');
    const isVendor = this.vendor.id === app.profile.id;
    const canFulfill = isVendor && [
      'AWAITING_FULFILLMENT',
      'PARTIALLY_FULFILLED',
    ].indexOf(orderState) > -1;
    const initialState = {
      timestamp: vendorOrderConfirmation.timestamp,
      showRefundButton: isVendor && [
        'AWAITING_FULFILLMENT',
        'PARTIALLY_FULFILLED',
        'DISPUTED',
      ].indexOf(orderState) > -1,
      showFulfillButton: canFulfill,
    };

    if (!this.isCase()) {
      if (isVendor) {
        // vendor looking at the order
        if (canFulfill) {
          initialState.infoText =
            app.polyglot.t('orderDetail.summaryTab.accepted.vendorCanFulfill');
        } else {
          initialState.infoText =
            app.polyglot.t('orderDetail.summaryTab.accepted.vendorReceived');
        }
      } else {
        // buyer looking at the order
        initialState.infoText =
          app.polyglot.t('orderDetail.summaryTab.accepted.buyerOrderAccepted');
      }
    } else {
      // mod looking at the order
      initialState.infoText =
        app.polyglot.t('orderDetail.summaryTab.accepted.modOrderAccepted');
    }

    if (this.accepted) this.accepted.remove();
    this.accepted = this.createChild(Accepted, {
      orderId: this.model.id,
      initialState,
    });
    this.listenTo(this.accepted, 'clickFulfillOrder',
      () => this.trigger('clickFulfillOrder'));

    this.vendor.getProfile()
        .done(profile => {
          this.accepted.setState({
            avatarHashes: profile.get('avatarHashes').toJSON(),
          });
        });

    this.$subSections.prepend(this.accepted.render().el);
  }

  renderRefundView() {
    const refundMd = this.model.get('refundAddressTransaction');

    if (!refundMd) {
      throw new Error('Unable to create the refunded view because the refundAddressTransaction ' +
        'data object has not been set.');
    }

    if (this.refunded) this.refunded.remove();
    this.refunded = this.createChild(Refunded, { model: refundMd });
    this.buyer.getProfile()
      .done(profile => this.refunded.setState({ buyerName: profile.get('name') }));
    this.$subSections.prepend(this.refunded.render().el);
  }

  renderFulfilledView() {
    const data = this.contract.get('vendorOrderFulfillment');

    if (!data) {
      throw new Error('Unable to create the fulfilled view because the vendorOrderFulfillment ' +
        'data object has not been set.');
    }

    if (this.fulfilled) this.fulfilled.remove();
    this.fulfilled = this.createChild(Fulfilled, {
      dataObject: data[0],
      initialState: {
        contractType: this.contract.type,
        showPassword: this.moderator && this.moderator.id !== app.profile.id || true,
      },
    });

    this.vendor.getProfile()
      .done(profile =>
        this.fulfilled.setState({ storeName: profile.get('name') }));

    const sections = document.createDocumentFragment();
    const $sections = $(sections).append(this.fulfilled.render().el);

    // If the order is not complete and this is the buyer, we'll
    // render a complete order form.
    if (['FULFILLED', 'RESOLVED'].indexOf(this.model.get('state')) > -1) {
      this.completeOrderForm = this.createChild(CompleteOrderForm, {
        model: new OrderCompletion(),
      });

      $sections.prepend(this.completeOrderForm.render().el);
    }

    this.$subSections.prepend($sections);
  }

  /**
   * Will render sub-sections in order based on their timestamp. Exempt from
   * this are the Order Details, Payment Details and Accepted sections which
   * are always first and in a specific order.
   */
  renderSubSections() {
    const sections = [];

    if (this.model.get('refundAddressTransaction')) {
      sections.push({
        function: this.renderRefundView,
        timestamp:
          (new Date(this.model.get('refundAddressTransaction').timestamp)).getTime(),
      });
    }

    if (this.contract.get('vendorOrderFulfillment')) {
      sections.push({
        function: this.renderFulfilledView,
        timestamp:
          (new Date(this.contract.get('vendorOrderFulfillment')[0].timestamp)).getTime(),
      });
    }

    sections.sort((a, b) => (a.timestamp - b.timestamp))
      .forEach(section => {
        if (typeof section.function === 'function') {
          section.function.call(this);
        } else {
          throw new Error('Unable to add sub section. It doesn\'t have a creation function.');
        }
      });
  }

  get $subSections() {
    return this._$subSections ||
      (this._$subSections = this.$('.js-subSections'));
  }

  remove() {
    super.remove();
  }

  render() {
    const templateData = {
      id: this.model.id,
      shouldShowPayForOrderSection: this.shouldShowPayForOrderSection(),
      isCase: this.isCase(),
      paymentAddress: this.paymentAddress,
      isTestnet: app.testnet,
      ...this.model.toJSON(),
    };

    if (this.shouldShowPayForOrderSection()) {
      templateData.balanceRemaining = this.getBalanceRemaining();
    }

    loadTemplate('modals/orderDetail/summaryTab/summary.html', t => {
      this.$el.html(t(templateData));
      this._$copiedToClipboard = null;

      if (this.stateProgressBar) this.stateProgressBar.remove();
      this.stateProgressBar = this.createChild(StateProgressBar, {
        initialState: this.progressBarState,
      });
      this.$('.js-statusProgressBarContainer').html(this.stateProgressBar.render().el);

      if (this.orderDetails) this.orderDetails.remove();
      this.orderDetails = this.createChild(OrderDetails, {
        model: this.contract,
        moderator: this.moderator,
      });
      this.$('.js-orderDetailsWrap').html(this.orderDetails.render().el);

      if (!this.isCase()) {
        if (this.payments) this.payments.remove();
        this.payments = this.createChild(Payments, {
          orderId: this.model.id,
          collection: this.paymentsCollection,
          orderPrice: this.orderPriceBtc,
          vendor: this.vendor,
          isOrderCancelable: () => this.model.get('state') === 'PENDING' &&
            !this.moderator && this.buyer.id === app.profile.id,
          isOrderConfirmable: () => this.model.get('state') === 'PENDING' &&
            this.vendor.id === app.profile.id && !this.contract.get('vendorOrderConfirmation'),
        });
        this.$('.js-paymentsWrap').html(this.payments.render().el);
      }

      if (this.shouldShowAcceptedSection()) this.renderAcceptedView();
      this.renderSubSections();
    });

    return this;
  }
}
