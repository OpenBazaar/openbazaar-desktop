import _ from 'underscore';
import app from '../../../app';
import { getExchangeRate } from '../../../utils/currency';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      userCurrency: 'USD',
      ...options.initialState || {},
    };
  }

  getState() {
    return this._state;
  }

  setState(state, replace = false) {
    let newState;

    if (replace) {
      this._state = {};
    } else {
      newState = _.extend({}, this._state, state);
    }

    if (!_.isEqual(this._state, newState)) {
      this._state = newState;
      this.render();
    }

    return this;
  }

  // Normally, we'd user the currency module to format currency, but
  // this is a unique case where we want to format a crypto price without
  // the currency symbol, so we'll create a custom function. If we find other
  // areas in the app need this, we can integrate it into the currency module.
  formatUnitlessCryptoAmount(amount) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide a number.');
    }

    return new Intl.NumberFormat(app.localSettings.standardizedTranslatedLang(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(amount);
  }

  render() {
    const state = this.getState();

    loadTemplate('modals/wallet/stats.html', (t) => {
      this.$el.html(t({
        ...state,
        formatUnitlessCryptoAmount: this.formatUnitlessCryptoAmount,
      }));
    });

    return this;
  }
}
