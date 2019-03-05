import app from '../../../../app';
import { clipboard } from 'electron';
import moment from 'moment';
import '../../../../utils/lib/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import {
  completingOrder,
  events as orderEvents,
} from '../../../../utils/order';
import { getCurrencyByCode as getWalletCurByCode } from '../../../../data/walletCurrencies';
import OrderCompletion from '../../../../models/order/orderCompletion/OrderCompletion';
import { checkValidParticipantObject } from '../OrderDetail.js';
import BaseVw from '../../../baseVw';
import StateProgressBar from './StateProgressBar';
import Payments from './Payments';
import Accepted from './Accepted';
import Fulfilled from './Fulfilled';
import Refunded from './Refunded';
import OrderDetails from './OrderDetails';
import CompleteOrderForm from './CompleteOrderForm';
import OrderComplete from './OrderComplete';
import DisputeStarted from './DisputeStarted';
import DisputePayout from './DisputePayout';
import DisputeAcceptance from './DisputeAcceptance';
import TimeoutInfo from './TimeoutInfo';
import PayForOrder from '../../../modals/purchase/Payment';
import ProcessingError from './ProcessingError';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.contract = this.model.get('contract');

    if (this.model.isCase) {
      this.contract = this.model.get('buyerOpened') ?
        this.model.get('buyerContract') :
        this.model.get('vendorContract');
    }

    checkValidParticipantObject(options.buyer, 'buyer');
    checkValidParticipantObject(options.vendor, 'vendor');

    if (this.contract.get('buyerOrder').payment.moderator) {
      checkValidParticipantObject(options.moderator, 'moderator');
    }

    this.options = options || {};
    this.vendor = options.vendor;
    this.buyer = options.buyer;
    this.moderator = options.moderator;

    this.listenTo(this.model, 'change:state', (md, state) => {
      this.stateProgressBar.setState(this.progressBarState);
      if (this.payments) this.payments.render();
      if (this.shouldShowAcceptedSection()) {
        if (!this.accepted) this.renderAcceptedView();
      } else {
        if (this.accepted) this.accepted.remove();
      }

      if (
        ['REFUNDED', 'FULFILLED', 'DISPUTED', 'DECIDED', 'RESOLVED', 'COMPLETED']
          .indexOf(state) > -1 && this.accepted) {
        const acceptedState = {
          showFulfillButton: false,
          infoText: app.polyglot.t('orderDetail.summaryTab.accepted.vendorReceived'),
          showRefundButton: false,
        };

        this.accepted.setState(acceptedState);
      }

      if (this.completeOrderForm &&
        ['FULFILLED', 'RESOLVED'].indexOf(state) === -1) {
        this.completeOrderForm.remove();
        this.completeOrderForm = null;
      }

      if (state === 'PROCESSING_ERROR') {
        if (this.payForOrder && !this.shouldShowPayForOrderSection()) {
          this.payForOrder.remove();
          this.payForOrder = null;
        }
      }

      if (this.shouldShowCompleteOrderForm() && !this.completeOrderForm) {
        this.renderCompleteOrderForm();
      }

      this.renderProcessingError();
      this.renderTimeoutInfoView();
    });

    if (!this.model.isCase) {
      this.listenTo(this.model.get('paymentAddressTransactions'), 'update', () => {
        if (this.payForOrder && !this.shouldShowPayForOrderSection()) {
          this.payForOrder.remove();
          this.payForOrder = null;
        }

        if (this.payments) {
          this.payments.collection.set(this.model.paymentsIn.models);
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
      if (e.id === this.model.id) {
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

    this.listenTo(this.contract, 'change:vendorOrderFulfillment', () => {
      // For some reason the order state still reflects the order state at the
      // time this event handler is called even though it is triggered by fetch
      // which brings the updated order state in its payload. Weird... maybe
      // backbone doesn't update the model until the field specific change handlers
      // are called...? Anyways... the timeout below fixeds the issue.
      setTimeout(() => {
        this.renderFulfilledView();
      });
    });

    this.listenTo(this.contract, 'change:buyerOrderCompletion',
      () => this.renderOrderCompleteView());

    this.listenTo(orderEvents, 'completeOrderComplete', e => {
      if (e.id === this.model.id && this.accepted) {
        this.model.set('state', 'COMPLETED');
        this.model.fetch();
      }
    });

    this.listenTo(orderEvents, 'openDisputeComplete', e => {
      if (e.id === this.model.id) {
        // The timeoutInfoView is expecting a dispute start time when
        // the order state is DISPUTED. Since we're setting the order state
        // now, but the server won't provide the dispute start time until
        // the fetch completes, we'll use a local dispute start time for
        // that brief gap.
        this.localDisputeStartTime = (new Date()).toISOString();
        this.listenToOnce(this.model, 'sync',
          () => (this.localDisputeStartTime = null));
        this.model.fetch();
        this.model.set('state', 'DISPUTED');
      }
    });

    if (!this.model.isCase) {
      this.listenTo(this.contract, 'change:dispute',
        () => this.renderDisputeStartedView());

      this.listenTo(this.contract, 'change:disputeResolution', () => {
        // Only render the dispute payout the first time we receive it
        // (it changes from undefined to an object with data). It shouldn't
        // be changing after that, but for some reason it is.
        if (!this.contract.previous('disputeResolution')) {
          // The timeout is needed in the handler so the updated
          // order state is available.
          setTimeout(() => this.renderDisputePayoutView());
        }
      });

      this.listenTo(orderEvents, 'acceptPayoutComplete', e => {
        if (e.id === this.model.id) {
          this.model.set('state', 'RESOLVED');
          this.model.fetch();
        }
      });

      this.listenTo(this.contract, 'change:disputeAcceptance', () => {
        this.renderDisputeAcceptanceView();

        if (this.disputePayout) {
          this.disputePayout.setState({ showAcceptButton: false });
        }
      });
    } else {
      this.listenTo(orderEvents, 'resolveDisputeComplete', e => {
        if (e.id === this.model.id) {
          this.model.set('state', 'RESOLVED');
          this.model.fetch();
        }
      });

      this.listenTo(this.model, 'change:resolution',
        () => this.renderDisputePayoutView());
    }

    this.listenTo(orderEvents, 'releaseEscrowComplete', e => {
      if (e.id === this.model.id) {
        this.model.set('state', 'PAYMENT_FINALIZED');
        this.model.fetch();
      }
    });

    const balanceMd = app.walletBalances.get(this.model.paymentCoin);
    const bindHeightChange = md => {
      this.listenTo(md, 'change:height',
        () => {
          if (this.timeoutInfo || this.shouldShowTimeoutInfoView) {
            this.renderTimeoutInfoView();
          }
        });
    };

    if (balanceMd) {
      bindHeightChange(balanceMd);
    } else {
      this.listenTo(app.walletBalances, 'add', md => {
        if (md.id === this.model.paymentCoin) {
          bindHeightChange(md);
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

    if (orderState === 'DISPUTED' || orderState === 'DECIDED' ||
      orderState === 'RESOLVED' ||
      (['COMPLETED', 'PAYMENT_FINALIZED'].includes(orderState) &&
        this.contract.get('dispute') !== undefined)) {
      if (!this.model.isCase) {
        state.states = [
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.disputed'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.decided'),
          app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.resolved'),
        ];

        if (!this.model.vendorProcessingError) {
          // You can't complete an order and leave a review when the vendor had a processing error.
          // In that case the flow ends at resolved.
          state.states.push(
            app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.complete')
          );
        }

        switch (orderState) {
          case 'DECIDED':
            state.currentState = 2;
            state.disputeState = 0;
            break;
          case 'RESOLVED':
            state.currentState = 3;
            state.disputeState = 0;
            break;
          case 'COMPLETED':
            state.currentState = 4;
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
    } else if (['DECLINED', 'CANCELED', 'REFUNDED'].includes(orderState)) {
      state.states = [
        app.polyglot.t('orderDetail.summaryTab.orderDetails.progressBarStates.paid'),
        app.polyglot.t(
          `orderDetail.summaryTab.orderDetails.progressBarStates.${orderState.toLowerCase()}`),
      ];
      state.currentState = 2;
      state.disputeState = 0;
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
        case 'PAYMENT_FINALIZED':
          state.currentState = 1;

          if (this.contract.get('vendorOrderConfirmation')) {
            state.currentState = 2;
          }

          if (this.contract.get('vendorOrderFulfillment')) {
            state.currentState = 3;
          }

          break;
        default:
          state.currentState = 0;
      }
    }

    return state;
  }

  get paymentAddress() {
    const vendorOrderConfirmation = this.contract.get('vendorOrderConfirmation');

    return vendorOrderConfirmation && vendorOrderConfirmation.paymentAddress ||
      this.contract.get('buyerOrder').payment.address;
  }

  setDisputeCountdownTimeout(...args) {
    clearTimeout(this.disputeCountdownTimeout);
    this.disputeCountdownTimeout = setTimeout(...args);
  }

  get shouldShowTimeoutInfoView() {
    const paymentCurData = this.model.paymentCoinData;

    return (
      (paymentCurData && paymentCurData.supportsEscrowTimeout) &&
      (
        this.model.isOrderDisputable ||
        ['DISPUTED', 'PAYMENT_FINALIZED'].includes(this.model.get('state'))
      )
    );
  }

  renderTimeoutInfoView() {
    const paymentCurData = this.model.paymentCoinData;
    const orderState = this.model.get('state');
    const prevMomentDaysThreshold = moment.relativeTimeThreshold('d');
    const isCase = this.model.isCase;

    if (!this.shouldShowTimeoutInfoView) {
      if (this.timeoutInfo) this.timeoutInfo.remove();
      this.timeoutInfo = null;
      clearTimeout(this.disputeCountdownTimeout);
      return;
    }

    // temporarily upping the moment threshold of number of days before month is used,
    // so in the escrow timeouts 45 is represented as '45 days' instead of '1 month'.
    moment.relativeTimeThreshold('d', 364);

    let state = {
      ownPeerId: app.profile.id,
      buyer: this.buyer.id,
      vendor: this.vendor.id,
      moderator: this.moderator && this.moderator.id || undefined,
      isFundingConfirmed: false,
      blockTime: paymentCurData && paymentCurData.blockTime,
      isDisputed: orderState === 'DISPUTED',
      hasDisputeEscrowExpired: false,
      canBuyerComplete: this.model.canBuyerComplete,
      isPaymentClaimable: false,
      isPaymentFinalized: false,
      showDisputeBtn: false,
      showDiscussBtn: orderState === 'DISPUTED',
      showResolveDisputeBtn: false,
      dataUnavailable: false,
    };

    if (orderState === 'PAYMENT_FINALIZED') {
      state.isPaymentFinalized = true;
    } else {
      let disputeStartTime;
      let escrowTimeoutHours;
      let curHeight;

      try {
        escrowTimeoutHours = this.contract.escrowTimeoutHours;
      } catch (e) {
        // pass - will be handled below
      }

      try {
        curHeight = app.walletBalances
          .get(this.model.paymentCoin)
          .get('height');
      } catch (e) {
        // pass
      }

      if (orderState === 'DISPUTED' || isCase) {
        try {
          if (isCase) {
            disputeStartTime = this.model.get('timestamp');
          } else {
            disputeStartTime = this.localDisputeStartTime ||
              this.contract.get('dispute').timestamp;
          }
        } catch (e) {
          throw e;
          // pass - will be handled below
        }
      }

      if (
        (orderState !== 'DISPUTED' && !escrowTimeoutHours) ||
        (orderState === 'DISPUTED' && !Date.parse(disputeStartTime))
      ) {
        // contract probably forged
        state = {
          ...state,
          invalidContractData: true,
          showDisputeBtn: this.model.isOrderStateDisputable,
          showResolveDisputeBtn: isCase,
        };
      } else if (!paymentCurData || !curHeight) {
        // The order was paid in a coin not supported by this client or we don't have
        // the current height of the paymentCoin, which means we don't know the
        // blocktime and can't display timeout info.
        state = {
          dataUnavailable: true,
        };
      } else {
        const timeoutHours = orderState === 'DISPUTED' ?
          this.contract.disputeExpiry : escrowTimeoutHours;
        let hasDisputeEscrowExpired;
        const totalMs = timeoutHours * 60 * 60 * 1000;
        state.totalTime =
          moment(Date.now()).from(moment(Date.now() + totalMs), true);

        if (isCase || orderState === 'DISPUTED') {
          const msSinceDisputeStart = Date.now() - (new Date(disputeStartTime)).getTime();
          const msRemaining = totalMs - msSinceDisputeStart;
          hasDisputeEscrowExpired = msRemaining <= 0;

          state = {
            ...state,
            hasDisputeEscrowExpired,
            timeRemaining: hasDisputeEscrowExpired ? 0 :
              moment(Date.now()).from(moment(Date.now() + msRemaining), true),
            showDiscussBtn: !hasDisputeEscrowExpired,
          };

          if (!hasDisputeEscrowExpired) {
            let checkBackInMs = 1000; // every second

            if (msRemaining > 1000 * 60 * 60 * 24) {
              // greater than a day
              checkBackInMs = 1000 * 60 * 60 * 20;
            } else if (msRemaining > 1000 * 60 * 60) {
              // greater than a hour
              checkBackInMs = 1000 * 60 * 55;
            } else if (msRemaining > 1000 * 60) {
              // greater than 1 minute
              checkBackInMs = 5000;
            }

            this.setDisputeCountdownTimeout(
              () => this.renderTimeoutInfoView(),
              checkBackInMs
            );
          }
        }

        if (isCase) {
          state = {
            ...state,
            buyerOpened: this.model.get('buyerOpened'),
            showResolveDisputeBtn: !hasDisputeEscrowExpired,
          };
        } else if (orderState === 'DISPUTED') {
          state = {
            ...state,
            isPaymentClaimable: hasDisputeEscrowExpired,
          };
        } else {
          const fundedHeight = this.model.fundedBlockHeight;
          const blocksPerTimeout = (timeoutHours * 60 * 60 * 1000) / paymentCurData.blockTime;
          const blocksRemaining = fundedHeight ?
            blocksPerTimeout - (curHeight - fundedHeight) :
            blocksPerTimeout;
          const msRemaining = blocksRemaining * paymentCurData.blockTime;

          const timeRemaining =
            moment(Date.now()).from(moment(Date.now() + msRemaining), true);

          state = {
            ...state,
            isFundingConfirmed: !!fundedHeight,
            blocksRemaining,
            timeRemaining,
            showDisputeBtn: this.model.isOrderDisputable && blocksRemaining > 0,
            isPaymentClaimable: orderState === 'FULFILLED' && blocksRemaining <= 0,
          };
        }
      }
    }

    // restore the days timeout threshold
    moment.relativeTimeThreshold('d', prevMomentDaysThreshold);

    if (this.timeoutInfo) {
      this.timeoutInfo.setState(state);
    } else {
      this.timeoutInfo = this.createChild(TimeoutInfo, {
        orderId: this.model.id,
        initialState: state,
      });

      this.getCachedEl('.js-timeoutInfoContainer')
        .html(this.timeoutInfo.render().el);

      this.listenTo(this.timeoutInfo, 'clickDisputeOrder', () => {
        this.trigger('clickDisputeOrder');
      });

      this.listenTo(this.timeoutInfo, 'clickDiscussOrder', () => {
        this.trigger('clickDiscussOrder');
      });

      this.listenTo(this.timeoutInfo, 'clickResolveDispute',
        () => this.trigger('clickResolveDispute'));
    }
  }

  shouldShowPayForOrderSection() {
    return this.buyer.id === app.profile.id &&
      this.model.paymentCoinData &&
      this.model.getBalanceRemaining() > 0 &&
      !this.model.vendorProcessingError;
  }

  shouldShowAcceptedSection() {
    let bool = false;

    // Show the accepted section if the order has been accepted and its fully funded.
    if (this.contract.get('vendorOrderConfirmation')
      && (this.model.isCase || this.model.getBalanceRemaining() <= 0)) {
      bool = true;
    }

    return bool;
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
      ].indexOf(orderState) > -1,
      showFulfillButton: canFulfill,
      paymentCoin: this.model.paymentCoin,
    };

    if (!this.model.isCase) {
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
    const paymentCoinData = this.model.paymentCoinData;

    if (!refundMd) {
      throw new Error('Unable to create the refunded view because the refundAddressTransaction ' +
        'data object has not been set.');
    }

    if (this.refunded) this.refunded.remove();
    this.refunded = this.createChild(Refunded, {
      model: refundMd,
      initialState: {
        isCrypto: this.contract.type === 'CRYPTOCURRENCY',
        blockChainTxUrl: paymentCoinData ?
          paymentCoinData.getBlockChainTxUrl(refundMd.id, app.serverConfig.testnet) :
          '',
      },
    });
    this.buyer.getProfile()
      .done(profile => this.refunded.setState({ buyerName: profile.get('name') }));
    this.$subSections.prepend(this.refunded.render().el);
  }

  shouldShowCompleteOrderForm() {
    return this.buyer.id === app.profile.id &&
      this.model.canBuyerComplete;
  }

  renderCompleteOrderForm() {
    const completingObject = completingOrder(this.model.id);
    const model = new OrderCompletion(
      completingObject ? completingObject.data : { orderId: this.model.id });
    if (this.completeOrderForm) this.completeOrderForm.remove();
    this.completeOrderForm = this.createChild(CompleteOrderForm, {
      model,
      slug: this.contract.get('vendorListings').at(0).get('slug'),
    });

    this.$subSections.prepend(this.completeOrderForm.render().el);
  }

  renderFulfilledView() {
    const data = this.contract.get('vendorOrderFulfillment');

    if (!data) {
      throw new Error('Unable to create the fulfilled view because the vendorOrderFulfillment ' +
        'data object has not been set.');
    }

    const fulfilledState = {
      contractType: this.contract.type,
      showPassword: this.moderator && this.moderator.id !== app.profile.id || true,
      isLocalPickup: this.contract.isLocalPickup,
    };

    if (this.contract.type === 'CRYPTOCURRENCY') {
      fulfilledState.coinType =
        this.contract.get('vendorListings').at(0)
          .get('metadata')
          .get('coinType');
    }

    if (this.fulfilled) this.fulfilled.remove();
    this.fulfilled = this.createChild(Fulfilled, {
      dataObject: data[0],
      initialState: fulfilledState,
    });

    if (app.profile.id === this.vendor.id) {
      this.fulfilled.setState({ noteFromLabel:
        app.polyglot.t('orderDetail.summaryTab.fulfilled.yourNoteLabel') });
    } else {
      this.vendor.getProfile()
        .done(profile => {
          this.fulfilled.setState({
            noteFromLabel: app.polyglot.t('orderDetail.summaryTab.fulfilled.noteFromStoreLabel',
              { store: profile.get('name') }),
          });
        });
    }

    if (this.completeOrderForm) {
      this.completeOrderForm.$el.after(this.fulfilled.render().el);
    } else {
      this.$subSections.prepend(this.fulfilled.render().el);

      if (this.shouldShowCompleteOrderForm()) this.renderCompleteOrderForm();
    }
  }

  renderOrderCompleteView() {
    const data = this.contract.get('buyerOrderCompletion');

    if (!data) {
      throw new Error('Unable to create the Order Complete view because the buyerOrderCompletion ' +
        'data object has not been set.');
    }

    if (this.orderComplete) this.orderComplete.remove();
    this.orderComplete = this.createChild(OrderComplete, {
      dataObject: data,
    });

    this.buyer.getProfile()
      .done(profile =>
        this.orderComplete.setState({ buyerName: profile.get('name') }));
    this.$subSections.prepend(this.orderComplete.render().el);
  }

  renderDisputeStartedView() {
    const data = this.model.isCase ? {
      timestamp: this.model.get('timestamp'),
      claim: this.model.get('claim'),
    } : this.contract.get('dispute');

    if (!data) {
      throw new Error('Unable to create the Dispute Started view because the dispute ' +
        'data object has not been set.');
    }

    let paymentCoinData;

    try {
      paymentCoinData = getWalletCurByCode(this.model.paymentCoin);
    } catch (e) {
      // pass
    }

    if (this.disputeStarted) this.disputeStarted.remove();
    this.disputeStarted = this.createChild(DisputeStarted, {
      initialState: {
        ...data,
        showResolveButton: this.model.get('state') === 'DISPUTED' &&
          this.model.isCase &&
           (!paymentCoinData || !paymentCoinData.supportsEscrowTimeout),
      },
    });

    // this is only set on the Case.
    const buyerOpened = this.model.get('buyerOpened');
    if (typeof buyerOpened !== 'undefined') {
      const disputeOpener = buyerOpened ? this.buyer : this.vendor;
      disputeOpener.getProfile()
        .done(profile =>
          this.disputeStarted.setState({ disputerName: profile.get('name') }));
    }

    this.listenTo(this.disputeStarted, 'clickResolveDispute',
      () => this.trigger('clickResolveDispute'));

    this.$subSections.prepend(this.disputeStarted.render().el);
  }

  renderDisputePayoutView() {
    const data = this.model.isCase ? this.model.get('resolution') :
      this.contract.get('disputeResolution');

    if (!data) {
      throw new Error('Unable to create the Dispute Payout view because the resolution ' +
        'data object has not been set.');
    }

    if (this.disputePayout) this.disputePayout.remove();
    this.disputePayout = this.createChild(DisputePayout, {
      orderId: this.model.id,
      initialState: {
        ...data,
        showAcceptButton: !this.model.isCase && this.model.get('state') === 'DECIDED',
        paymentCoin: this.model.paymentCoin,
      },
    });

    ['buyer', 'vendor', 'moderator'].forEach(type => {
      this[type].getProfile().done(profile => {
        const state = {};
        state[`${type}Name`] = profile.get('name');
        state[`${type}AvatarHashes`] = profile.get('avatarHashes').toJSON();
        this.disputePayout.setState(state);
      });
    });

    this.$subSections.prepend(this.disputePayout.render().el);
  }

  renderPayForOrder() {
    const paymentCoin = this.model.paymentCoin;

    if (getWalletCurByCode(paymentCoin)) {
      if (this.payForOrder) this.payForOrder.remove();

      this.payForOrder = this.createChild(PayForOrder, {
        balanceRemaining: this.model.getBalanceRemaining({ convertFromSat: true }),
        paymentAddress: this.paymentAddress,
        orderId: this.model.id,
        isModerated: !!this.moderator,
        metricsOrigin: 'Transactions',
        paymentCoin: this.model.paymentCoin,
      });

      this.getCachedEl('.js-payForOrderWrap').html(this.payForOrder.render().el);
    }
  }

  renderDisputeAcceptanceView() {
    const data = this.contract.get('disputeAcceptance');

    if (!data) {
      throw new Error('Unable to create the Dispute Acceptance view because the ' +
        'disputeAcceptance data object has not been set.');
    }

    const closer = data.closedBy ===
      this.buyer.id ? this.buyer : this.vendor;

    if (this.disputeAcceptance) this.disputeAcceptance.remove();
    this.disputeAcceptance = this.createChild(DisputeAcceptance, {
      initialState: {
        timestamp: data.timestamp,
        acceptedByBuyer: closer.id === this.buyer.id,
        buyerViewing: app.profile.id === this.buyer.id,
        vendorProcessingError: this.model.vendorProcessingError,
      },
    });

    closer.getProfile()
      .done(profile =>
        this.disputeAcceptance.setState({
          closerName: profile.get('name'),
          closerAvatarHashes: profile.get('avatarHashes').toJSON(),
        }));

    if (this.completeOrderForm) {
      this.completeOrderForm.$el.after(this.disputeAcceptance.render().el);
    } else {
      this.$subSections.prepend(this.disputeAcceptance.render().el);

      if (this.shouldShowCompleteOrderForm()) this.renderCompleteOrderForm();
    }
  }

  /**
   * Will render sub-sections in order based on their timestamp. Exempt from
   * this are the Order Details, Payment Details and Accepted sections which
   * are always first and in a specific order.
   */
  renderSubSections() {
    const sections = [];
    const isCase = this.model.isCase;

    if (this.model.get('refundAddressTransaction')) {
      sections.push({
        function: this.renderRefundView,
        timestamp:
          (new Date(this.model.get('refundAddressTransaction').timestamp)),
      });
    }

    if (this.contract.get('vendorOrderFulfillment')) {
      sections.push({
        function: this.renderFulfilledView,
        timestamp:
          (new Date(this.contract.get('vendorOrderFulfillment')[0].timestamp)),
      });
    }

    if (this.contract.get('buyerOrderCompletion')) {
      sections.push({
        function: this.renderOrderCompleteView,
        timestamp:
          (new Date(this.contract.get('buyerOrderCompletion').timestamp)),
      });
    }

    if (this.contract.get('dispute') || isCase) {
      const timestamp = isCase ?
        this.model.get('timestamp') :
        this.contract.get('dispute').timestamp;

      sections.push({
        function: this.renderDisputeStartedView,
        timestamp:
          (new Date(timestamp)),
      });
    }

    if (this.contract.get('disputeResolution') ||
      (isCase && this.model.get('resolution'))) {
      const timestamp = isCase ?
        this.model.get('resolution').timestamp :
        this.contract.get('disputeResolution').timestamp;

      sections.push({
        function: this.renderDisputePayoutView,
        timestamp:
          (new Date(timestamp)),
      });
    }

    if (this.contract.get('disputeAcceptance')) {
      sections.push({
        function: this.renderDisputeAcceptanceView,
        timestamp:
          (new Date(this.contract.get('disputeAcceptance').timestamp)),
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

  renderProcessingError() {
    if (!this.model.vendorProcessingError) {
      if (this.processingError) {
        this.processingError.remove();
        this.processingError = null;
      }

      return;
    }

    const isBuyer = this.buyer.id === app.profile.id;
    const state = {
      isBuyer,
      isModerator: !!(this.moderator && this.moderator.id),
      isOrderCancelable: this.model.isOrderCancelable,
      isModerated: !!this.moderator,
      isCase: this.model.isCase,
      isDisputable: isBuyer &&
        this.model.isOrderDisputable &&
        this.model.get('state') === 'PROCESSING_ERROR',
      errors: this.contract.get('errors') || [],
    };

    if (!this.processingError) {
      this.processingError = this.createChild(ProcessingError, {
        orderId: this.model.id,
        initialState: state,
      });
      this.getCachedEl('.js-processingErrorContainer')
        .html(this.processingError.render().el);
    } else {
      this.processingError.setState(state);
    }
  }

  get $subSections() {
    return this._$subSections ||
      (this._$subSections = this.$('.js-subSections'));
  }

  remove() {
    clearTimeout(this.disputeCountdownTimeout);
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/orderDetail/summaryTab/summary.html', t => {
      const paymentCoin = this.model.paymentCoin;
      let templateData = {
        id: this.model.id,
        isCase: this.model.isCase,
        paymentCoin,
        ...this.model.toJSON(),
      };

      if (this.model.isCase) {
        const paymentCoinData = this.model.paymentCoinData;
        const paymentAddress = this.paymentAddress;

        templateData = {
          ...templateData,
          blockChainAddressUrl: paymentCoinData ?
            paymentCoinData.getBlockChainAddressUrl(paymentAddress, app.serverConfig.testnet) :
            false,
          paymentAddress,
        };
      }

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

      if (this.shouldShowPayForOrderSection()) {
        this.renderPayForOrder();
      }

      this.renderTimeoutInfoView();

      if (!this.model.isCase) {
        if (getWalletCurByCode(paymentCoin)) {
          if (this.payments) this.payments.remove();
          this.payments = this.createChild(Payments, {
            orderId: this.model.id,
            collection: this.model.paymentsIn,
            orderPrice: this.model.orderPrice,
            vendor: this.vendor,
            isOrderCancelable: () => this.model.isOrderCancelable,
            isCrypto: this.contract.type === 'CRYPTOCURRENCY',
            isOrderConfirmable: () => this.model.get('state') === 'PENDING' &&
              this.vendor.id === app.profile.id && !this.contract.get('vendorOrderConfirmation'),
            paymentCoin,
          });
          this.$('.js-paymentsWrap').html(this.payments.render().el);
        } else {
          this.getCachedEl('.js-paymentsWrap').html(
            `
            <div class="rowLg border clrBr padMd">
              <i class="ion-alert-circled clrTAlert"></i>
              <span>
                ${app.polyglot.t('orderDetail.summaryTab.unableToShowPayments', {
                  cur: paymentCoin,
                })}
              </span>
            </div>  
            `
          );
        }
      }

      if (this.shouldShowAcceptedSection()) this.renderAcceptedView();
      this.renderSubSections();
      this.renderProcessingError();
    });

    return this;
  }
}
