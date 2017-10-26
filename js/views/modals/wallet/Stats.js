import _ from 'underscore';
import app from '../../../app';
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
  // this is a unique case where we want to format a BTC price without
  // the BTC symbol, so we'll create a custom function. If we find other
  // areas in the app need this, we can integrate it into the currency module.
  formatUnitlessBtc(amount) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide a number.');
    }

    return new Intl.NumberFormat(app.localSettings.standardizedTranslatedLang(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(amount);
  }

  render() {
    loadTemplate('modals/wallet/stats.html', (t) => {
      this.$el.html(t({
        ...this._state,
        formatUnitlessBtc: this.formatUnitlessBtc,
      }));
    });

    return this;
  }
}
