import _ from 'underscore';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.collection) {
      throw new Error('Please provide a Transactions collection.');
    }

    this._state = {
      ...options.initialState || {},
    };
  }

  className() {
    return 'walletTransactions';
  }

  events() {
    return {
      'click .js-retryInitialFetch': 'onClickRetryInitialFetch',
    };
  }

  onClickRetryInitialFetch() {
    this.trigger('retryInitialFetchClick');
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

  render() {
    loadTemplate('modals/wallet/transactions.html', (t) => {
      this.$el.html(t({
        transactions: this.collection.toJSON(),
        ...this._state,
      }));
    });

    return this;
  }
}
