// import app from '../../app';
// import moment from 'moment';
// import $ from 'jquery';
import _ from 'underscore';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isFetching: false,
        fetchError: '',
      },
      ...options,
    };

    super(opts);

    if (!this.collection) {
      throw new Error('Please provide a collection');
    }

    this._state = {
      ...opts.initialState || {},
    };
  }

  className() {
    return 'purchasesTable';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  onClickRetryFetch() {
    this.trigger('retryFetchClick');
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
    loadTemplate('transactions/purchasesTable.html', (purchasesT) => {
      loadTemplate('transactions/transactionsTable.html', (t) => {
        const transactionsTable = t({
          type: 'purchases',
        });
        // const $transactionsTable = $(`<div>${transactionsTable}</div>`);

        this.$el.html(purchasesT({
          ...this._state,
          // purchaseCount: this.collection.length,
          purchaseCount: 0,
          transactionsTable,
        }));
      });
    });

    return this;
  }
}
