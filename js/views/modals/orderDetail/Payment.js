import _ from 'underscore';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);

    if (!this.model) {
      throw new Error('Please provide a model.');
    }

    this._state = {
      paymentNumber: 1,
      amountShort: 0,
      showAmountShort: false,
      payee: '',
      userCurrency: app.settings.get('localCurrency') || 'BTC',
      showActionButtons: false,
      ...options.initialState || {},
    };
  }

  className() {
    return 'payment';
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
    loadTemplate('modals/orderDetail/payment.html', (t) => {
      this.$el.html(t({
        ...this._state,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
