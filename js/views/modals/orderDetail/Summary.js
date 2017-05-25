import app from '../../../app';
import { clipboard } from 'electron';
import '../../../utils/velocity';
import loadTemplate from '../../../utils/loadTemplate';
import { Model } from 'backbone';
import BaseVw from '../../baseVw';
import StateProgressBar from './StateProgressBar';
import Payment from './Payment';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this.options = opts || {};
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

  get $copiedToClipboard() {
    return this._$copiedToClipboard ||
      (this._$copiedToClipboard = this.$('.js-copiedToClipboard'));
  }

  remove() {
    super.remove();
  }

  render() {
    loadTemplate('modals/orderDetail/summary.html', t => {
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
          paymentNumber: 1,
          amountShort: 0,
          showAmountShort: false,
          payee: app.profile.get('name'),
          showActionButtons: false,
        },
      });
      this.$('.js-paymentWrap').html(this.payment.render().el);
    });

    return this;
  }
}
