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
      contract = this.model.get(buyerOpened ? 'buyerContract' : 'vendorContract');
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
        app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.paid'),
        app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.accepted'),
        app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.fulfilled'),
        app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.complete'),
      ],
    };

    if (orderState === 'DISPUTED' || orderState === 'DECIDED' ||
      orderState === 'RESOLVED') {
      if (!this.isCase()) {
        state.states = [
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.disputed'),
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.decided'),
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.resolved'),
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.complete'),
        ];
      } else {
        state.states = [
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.disputed'),
          app.polyglot.t('orderDetail.discussionTab.summaryTab.orderDetails.complete'),
        ];
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

  render() {
    loadTemplate('modals/orderDetail/summaryTab/summary.html', t => {
      this.$el.html(t({
        id: this.model.id,
        ...this.model.toJSON(),
      }));

      this._$copiedToClipboard = null;

      if (this.stateProgressBar) this.stateProgressBar.remove();
      this.stateProgressBar = this.createChild(StateProgressBar, {
        initialState: {
          states: ['Paid', 'Accepted', 'Fulfilled', 'Complete'],
          currentState: 1,
        },
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
