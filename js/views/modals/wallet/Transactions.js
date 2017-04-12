import $ from 'jquery';
import _ from 'underscore';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Transaction from './Transaction';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    if (!this.collection) {
      throw new Error('Please provide a Transactions collection.');
    }

    this._state = {
      ...options.initialState || {},
    };

    this.transactions = [];

    this.listenTo(this.collection, 'update', (cl, opts) => {
      if (opts.changes.added.length) {
        // Expecting either a single new transactions on top or a page
        // of transactions on the bottom.
        if (opts.changes.added.length === this.collection.length ||
          opts.changes.added[opts.changes.added.length - 1] ===
            this.collection.at(this.collection.length - 1)) {
          // It's a page of transactions at the bottom
          const docFrag = document.createDocumentFragment();
          this.collection.slice(this.collection.length - opts.changes.added.length)
            .forEach(md => {
              const view = this.createTransaction({ model: md });

              view.render()
                .$el
                .appendTo(docFrag);
            });
          setTimeout(() => {
            this.$('.js-transactionListContainer').append(docFrag);
          });
        }
      }
    });

    this.fetchTransactions();
  }

  createTransaction(options = {}) {
    return this.createChild(Transaction, options);
  }

  className() {
    return 'walletTransactions';
  }

  events() {
    return {
      'click .js-retryFetch': 'onClickRetryFetch',
    };
  }

  onClickRetryFetch() {
    this.fetchTransactions();
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

  get transactionsPerFetch() {
    return 100;
  }

  // get transactionsPerPage() {
  // }

  isFetching() {
    return this.transactionsFetch &&
      this.transactionsFetch.state() === 'prending';
  }

  fetchTransactions() {
    if (this.transactionsFetch) this.transactionsFetch.abort();

    const fetchParams = {
      limit: this.transactionsPerFetch,
    };

    if (this.collection.length) {
      fetchParams.offsetId = this.collection.at(this.collection.length - 1).id;
    }

    this.transactionsFetch = this.collection.fetch({
      data: fetchParams,
    });

    this.transactionsFetch.always(() => {
      this.setState({
        isFetching: false,
      });
    }).fail((jqXhr) => {
      const state = { fetchFailed: true };

      if (jqXhr.responseJSON && jqXhr.responseJSON.reason) {
        state.fetchErrorMessage = jqXhr.responseJSON.reason;
      }

      this.setState(state);
    });

    this.setState({
      isFetching: true,
    });
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    super.remove();
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
