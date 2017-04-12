// import $ from 'jquery';
import _ from 'underscore';
// import app from '../../../app';
import { isScrolledIntoView } from '../../../utils/dom';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Transaction from './Transaction';
import TransactionFetchState from './TransactionFetchState';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.collection) {
      throw new Error('Please provide a Transactions collection.');
    }

    if (!options.$scrollContainer || !options.$scrollContainer.length) {
      throw new Error('Please provide a jQuery object containing the scrollable element ' +
        'this view is in.');
    }

    // this._state = {
    //   ...options.initialState || {},
    // };

    this.transactionViews = [];
    this.fetchFailed = false;
    this.fetchErrorMessage = '';

    this.listenTo(this.collection, 'update', (cl, opts) => {
      this.render();
      if (!this.rendered) return;

      if (opts.changes.added.length) {
        // Expecting either a single new transactions on top or a page
        // of transactions on the bottom.
        if (opts.changes.added.length === this.collection.length ||
          opts.changes.added[opts.changes.added.length - 1] ===
            this.collection.at(this.collection.length - 1)) {
          console.log('hey hey another paginamente');

          // It's a page of transactions at the bottom
          const docFrag = document.createDocumentFragment();
          this.collection.slice(this.collection.length - opts.changes.added.length)
            .forEach(md => {
              // const view = this.createTransaction({ model: md });

              // view.render()
              //   .$el
              //   .appendTo(docFrag);
            });
        }
      }
    });

    this.$scrollContainer = options.$scrollContainer;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    this.fetchTransactions();
  }

  className() {
    return 'walletTransactions';
  }

  onScroll() {
    const lastTransaction = this.transactionViews[this.transactionViews.length - 1];

    if (!this.isFetching && isScrolledIntoView(lastTransaction.el)) {
      this.fetchTransactions();
    }
  }

  // getState() {
  //   return this._state;
  // }

  // setState(state, replace = false) {
  //   let newState;

  //   if (replace) {
  //     this._state = {};
  //   } else {
  //     newState = _.extend({}, this._state, state);
  //   }

  //   if (!_.isEqual(this._state, newState)) {
  //     this._state = newState;
  //     this.render();
  //   }

  //   return this;
  // }

  get transactionsPerFetch() {
    return 2;
  }

  get isFetching() {
    return this.transactionsFetch &&
      this.transactionsFetch.state() === 'pending';
  }

  get allLoaded() {
    return this.collection.length === this.countAtFirstFetch;
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
      remove: false,
    });

    this.transactionsFetch.always(() => {
      if (this.transactionFetchState) {
        this.transactionFetchState.setState({
          isFetching: false,
        });
      }
    }).fail((jqXhr) => {
      this.fetchFailed = true;

      if (jqXhr.responseJSON && jqXhr.responseJSON.reason) {
        this.fetchErrorMessage = jqXhr.responseJSON.reason;
      }

      if (this.transactionFetchState) {
        this.transactionFetchState.setState({
          fetchFailed: this.fetchFailed,
          fetchErrorMessage: this.fetchErrorMessage,
        });
      }
    }).done(data => {
      if (typeof this.countAtFirstFetch === 'undefined') {
        this.countAtFirstFetch = data.count;
      }
    });

    if (this.transactionFetchState) {
      this.transactionFetchState.setState({
        isFetching: true,
        transactionsPresent: !!this.collection.length,
      });
    }

    this.fetchFailed = false;
    this.fetchErrorMessage = '';
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    super.remove();
  }

  createTransactionView(model, options = {}) {
    const view = this.createChild(Transaction, {
      model,
      ...options,
    });

    return view;
  }

  render() {
    loadTemplate('modals/wallet/transactions.html', (t) => {
      this.$el.html(t({
        transactions: this.collection.toJSON(),
        // ...this._state,
        isFetching: this.isFetching,
      }));
    });

    this.$transactionsContainer = this.$('.js-transactionListContainer');
    this.transactionViews.forEach(transaction => transaction.remove());
    this.transactionViews = [];
    const transactionsFrag = document.createDocumentFragment();

    this.collection.forEach(transaction => {
      const view = this.createTransactionView(transaction);
      this.transactionViews.push(view);
      view.render().$el.appendTo(transactionsFrag);
    });

    this.$transactionsContainer.append(transactionsFrag);

    if (this.collection.length && !this.allLoaded) {
      this.$scrollContainer.off('scroll', this.throttledOnScroll)
        .on('scroll', this.throttledOnScroll);
    } else {
      this.$scrollContainer.off('scroll', this.throttledOnScroll);
    }

    if (this.transactionFetchState) this.transactionFetchState.remove();
    this.transactionFetchState = this.createChild(TransactionFetchState, {
      initialState: {
        isFetching: this.isFetching,
        fetchFailed: this.fetchFailed,
        fetchErrorMessage: this.fetchErrorMessage,
        transactionsPresent: !!this.collection.length,
      },
    });
    this.$('.js-transactionFetchStateWrap').html(this.transactionFetchState.render().el);

    return this;
  }
}
