import app from '../../../../app';
import { clipboard } from 'electron';
import '../../../../utils/velocity';
import loadTemplate from '../../../../utils/loadTemplate';
import { Model } from 'backbone';
import BaseVw from '../../../baseVw';
import StateProgressBar from './StateProgressBar';
import Payment from './Payment';
import AcceptedEvent from './AcceptedEvent';
import OrderDetails from './OrderDetails';

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
    this.moderator = opts.moderator;

    this.listenTo(this.model, 'change:state',
      () => this.stateProgressBar.setState(this.progressBarState));
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
    } else {
      switch (orderState) {
        case 'PENDING':
          state.currentState = 1;
          break;
        case 'AWAITING_FULFILLMENT' || 'PARTIALLY_FULFILLED':
          state.currentState = 2;
          break;
        case 'AWAITING_PICKUP' || 'FULFILLED':
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

  remove() {
    super.remove();
  }

  get balanceRemaining() {
    if (this.isCase()) {
      throw new Error('Cases do not have any transaction data.');
    }

    let balanceRemaining = 0;

    if (this.model.get('state') === 'AWAITING_PAYMENT') {
      const orderPrice = this.contract.get('vendorListings')
        .at(0)
        .get('item')
        .get('price');
      const totalPaid = this.model.get('transactions')
        .reduce((total, transaction) => (total + transaction.value), 0);
      balanceRemaining = orderPrice - totalPaid;
    }

    return balanceRemaining;
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/summary.html', t => {
      this.$el.html(t({
        id: this.model.id,
        balanceRemaining: this.balanceRemaining,
        ...this.model.toJSON(),
      }));

      this._$copiedToClipboard = null;

      if (!this.balanceRemaining) {
        this.$('.js-payForOrderWrap').addClass('hide');
      }

      if (this.stateProgressBar) this.stateProgressBar.remove();
      this.stateProgressBar = this.createChild(StateProgressBar, {
        initialState: this.progressBarState,
      });
      this.$('.js-statusProgressBarContainer').html(this.stateProgressBar.render().el);

      if (this.payment) this.payment.remove();
      this.payment = this.createChild(Payment, {
        model: new Model({
          txid: '6d2cf390834a5578fdfe2bd2d2469992cce7d7c6656122ff78b968f62e2c41a4',
          value: 0.000623,
          confirmations: 3537,
        }),
        initialState: {
          paymentNumber: 2,
          amountShort: 0,
          showAmountShort: false,
          payee: app.profile.get('name'),
          showActionButtons: false,
        },
      });
      this.$('.js-paymentWrap').html(this.payment.render().el);

      if (this.payment2) this.payment2.remove();
      this.payment2 = this.createChild(Payment, {
        model: new Model({
          txid: '6d2cf390834a5578fdfe2bd2d2469992cce7d7c6656122ff78b968f62e2c41a4',
          value: 0.00583,
          confirmations: 4967856,
        }),
        initialState: {
          paymentNumber: 1,
          amountShort: 0.00032,
          showAmountShort: true,
          payee: app.profile.get('name'),
          showActionButtons: true,
        },
      });
      this.$('.js-paymentWrap2').html(this.payment2.render().el);

      if (this.acceptedEvent) this.acceptedEvent.remove();
      this.acceptedEvent = this.createChild(AcceptedEvent, {
        model: new Model({
          timestamp: '2017-05-26T17:53:40.719697497Z',
        }),
        initialState: {
          infoText: 'You received the order and can fulfill it whenevery you\'re ready.',
          showActionButtons: true,
        },
      });
      this.$('.js-acceptedWrap').html(this.acceptedEvent.render().el);

      this.vendor.getProfile()
          .done(profile => {
            this.acceptedEvent.setState({
              avatarHashes: profile.get('avatarHashes').toJSON(),
            });
          });

      if (this.orderDetails) this.orderDetails.remove();
      this.orderDetails = this.createChild(OrderDetails, {
        model: this.contract,
        moderator: this.moderator,
      });
      this.$('.js-orderDetailsWrap').html(this.orderDetails.render().el);
    });

    return this;
  }
}
