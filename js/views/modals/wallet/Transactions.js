// import $ from 'jquery';
import _ from 'underscore';
// import app from '../../../app';
import { isScrolledIntoView } from '../../../utils/dom';
import { getSocket } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Transaction from './Transaction';
import TransactionFetchState from './TransactionFetchState';
import PopInMessage from '../../PopInMessage';

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
    this.newTransactionCount = 0;

    this.listenTo(this.collection, 'update', () => (this.render()));

    const serverSocket = getSocket();

    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // "wallet" sockets come for new transactions and when a transaction gets it's
        // first confirmation. We're only listed in new transactions (i.e. the height will be 0)
        if (e.jsonData.wallet) {
          const transaction = this.collection.get(e.jsonData.wallet.txid);

          if (transaction) {
            // existing transaction has been confirmed
            console.log('been confirmed');
            window.confirmed = _.omit(e.jsonData.wallet, 'timestamp');
            transaction.set(transaction.parse({
              // Omitting timestamp since it's not set properly in the socket. In either case,
              // the transaction should already have it set.
              ...(_.omit(e.jsonData.wallet, 'timestamp')),
            }));
          } else {
            // new transaction
            this.newTransactionCount += 1;
            this.showNewTransactionPopup();
          }
        }

        // The "walletUpdate" socket comes on a regular interval and gives us the current block
        // height which we can use to update the confirmations on a transaction.
        if (e.jsonData.walletUpdate) {
          this.collection.models
            .filter(transaction => (transaction.get('height') > 0))
            .forEach(transaction => {
              transaction.set('confirmations',
                e.jsonData.walletUpdate.height - transaction.get('height'));
            });
        }
      });
    }

    this.$scrollContainer = options.$scrollContainer;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    this.fetchTransactions();
  }

  className() {
    return 'walletTransactions';
  }

  onScroll() {
    if (this.collection.length && !this.allLoaded) {
      // fetch next batch of transactions
      const lastTransaction = this.transactionViews[this.transactionViews.length - 1];

      if (!this.isFetching && isScrolledIntoView(lastTransaction.el)) {
        this.fetchTransactions();
      }
    }

    if (this.newTransactionPopIn) {
      this.setPopInMessageHolderPositioning();
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
    return 5;
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

  setPopInMessageHolderPositioning() {
    this.$popInMessages.toggleClass('notFixed', this.$scrollContainer[0].scrollTop < 338);
  }

  showNewTransactionPopup() {
    const refreshLink =
      '<a class="js-refresh">Refresh</a>';

    if (this.newTransactionPopIn && !this.newTransactionPopIn.isRemoved()) {
      this.newTransactionPopIn.setState({
        messageText: `${this.newTransactionCount} new transactions ${refreshLink}`,
      });
    } else {
      // TODO TODO TODO TODO: translate!!!
      this.newTransactionPopIn = this.createChild(PopInMessage, {
        // messageText: app.polyglot.t('userPage.store.listingDataChangedPopin',
            // { refreshLink }),
        messageText: `${this.newTransactionCount} new transactions ${refreshLink}`,
      });

      this.listenTo(this.newTransactionPopIn, 'clickRefresh', () => {
        this.collection.reset();
        this.fetchTransactions();
        this.render();
      });

      this.listenTo(this.newTransactionPopIn, 'clickDismiss', () => {
        this.newTransactionPopIn.remove();
        this.newTransactionPopIn = null;
      });

      this.$popInMessages.append(this.newTransactionPopIn.render().el);
      this.setPopInMessageHolderPositioning();
    }
  }

  createTransactionView(model, options = {}) {
    const view = this.createChild(Transaction, {
      model,
      ...options,
    });

    return view;
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    super.remove();
  }

  get $popInMessages() {
    return this._$popInMessages ||
      (this._$popInMessages = this.$('.js-popInMessages'));
  }

  render() {
    this.newTransactionCount = 0;
    if (this.newTransactionPopIn) {
      this.newTransactionPopIn.remove();
      this.newTransactionPopIn = null;
    }

    loadTemplate('modals/wallet/transactions.html', (t) => {
      this.$el.html(t({
        transactions: this.collection.toJSON(),
        // ...this._state,
        isFetching: this.isFetching,
      }));
    });

    this.$transactionsContainer = this.$('.js-transactionListContainer');
    this._$popInMessages = null;

    this.transactionViews.forEach(transaction => transaction.remove());
    this.transactionViews = [];
    const transactionsFrag = document.createDocumentFragment();

    this.collection.forEach(transaction => {
      const view = this.createTransactionView(transaction);
      this.transactionViews.push(view);
      view.render().$el.appendTo(transactionsFrag);
    });

    this.$transactionsContainer.append(transactionsFrag);

    this.$scrollContainer.off('scroll', this.throttledOnScroll)
      .on('scroll', this.throttledOnScroll);

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
