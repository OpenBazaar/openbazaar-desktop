import _ from 'underscore';
import moment from 'moment';
import app from '../../../../app';
import { abbrNum } from '../../../../utils';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this._state = {
      paymentNumber: 1,
      amountShort: 0,
      balanceRemaining: 0,
      payee: '',
      buyerName: '',
      userCurrency: app.settings.get('localCurrency') || 'BTC',
      showAcceptRejectButtons: false,
      showCancelButton: false,
      acceptInProgress: false,
      rejectInProgress: false,
      cancelInProgress: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'payment rowLg';
  }

  events() {
    return {
      'click .js-cancelOrder': 'onClickCancelOrder',
    };
  }

  onClickCancelOrder() {
    this.trigger('cancelClick', { view: this });
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false, renderOnChange = true) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (renderOnChange && !_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  render() {
    loadTemplate('modals/orderDetail/summaryTab/payment.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
        abbrNum,
        moment,
      }));
    });

    return this;
  }
}
