import _ from 'underscore';
import app from '../../../app';
import { isScrolledIntoView } from '../../../utils/dom';
import { getSocket, getCurrentConnection } from '../../../utils/serverConnect';
import { openSimpleMessage } from '../SimpleMessage';
import { launchSettingsModal } from '../../../utils/modalManager';
import TransactionMd from '../../../models/wallet/Transaction';
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

    this.transactionViews = [];
    this.fetchFailed = false;
    this.fetchErrorMessage = '';
    this.newTransactionCount = 0;
    this.popInTimeouts = [];

    this.listenTo(this.collection, 'update', (cl, opts) => {
      if (opts.changes.added.length) {
        // Expecting either a single new transactions on top or a page
        // of transactions on the bottom.
        if (opts.changes.added.length === this.collection.length ||
          opts.changes.added[opts.changes.added.length - 1] ===
            this.collection.at(this.collection.length - 1)) {
          // It's a page of transactions at the bottom
          this.renderTransactions(opts.changes.added, 'append');
        } else {
          // New transaction at top
          this.renderTransactions(opts.changes.added, 'prepend');
        }
      }
    });

    this.listenTo(app.settings, 'change:localCurrency', () => {
      this.renderTransactions(this.collection.models, 'replace');
    });

    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => {
      this.renderTransactions(this.collection.models, 'replace');
    });

    const serverSocket = getSocket();

    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // "wallet" sockets come for new transactions and when a transaction gets it's
        // first confirmation. We're only interested in new transactions (i.e. the height will be 0)
        if (e.jsonData.wallet) {
          const transaction = this.collection.get(e.jsonData.wallet.txid);

          if (transaction) {
            // existing transaction has been confirmed
            transaction.set(transaction.parse({
              // Omitting timestamp since it's not set properly in the socket. In either case,
              // the transaction should already have it set.
              ...(_.omit(e.jsonData.wallet, 'timestamp')),
            }));
          } else {
            // new transaction
            this.newTransactionCount += 1;

            // This is a bit ugly... but most incoming transactions (ones sent via our UI)
            // are immediately added to the list when their respective APIs succeeds and
            // therefore should not be included in the "new transactions" pop in count.
            // But, at this point we don't know if these are such transactions, so we'll
            // check back in a bit and see if they've already been added or not. It's a matter
            // of the socket coming in before the AJAX call returns.
            const timeout = setTimeout(() => {
              if (this.collection.get(e.jsonData.wallet.txid)) {
                this.newTransactionCount -= 1;
              } else {
                this.showNewTransactionPopup();
              }
            }, 1500);

            this.popInTimeouts.push(timeout);
          }
        }

        // The "walletUpdate" socket comes on a regular interval and gives us the current block
        // height which we can use to update the confirmations on a transaction.
        if (e.jsonData.walletUpdate) {
          this.collection.models
            .filter(transaction => (transaction.get('height') > 0))
            .forEach(transaction => {
              const txHeight = transaction.get('height');
              let confirmations = 0;

              if (txHeight > 0) {
                confirmations = e.jsonData.walletUpdate.height - txHeight + 1;
              }

              transaction.set('confirmations', confirmations);
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

  get transactionsPerFetch() {
    return 25;
  }

  get isFetching() {
    return this.transactionsFetch &&
      this.transactionsFetch.state() === 'pending';
  }

  get allLoaded() {
    return this.collection.length >= this.countAtFirstFetch;
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
      if (this.isRemoved()) return;

      if (this.transactionFetchState) {
        if (!this.collection.length) {
          this.render();
        } else {
          this.transactionFetchState.setState({
            isFetching: false,
          });
        }
      }
    }).fail((jqXhr) => {
      if (jqXhr.statusText === 'abort') return;

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
      if (this.isRemoved()) return;

      if (typeof this.countAtFirstFetch === 'undefined') {
        this.countAtFirstFetch = data.count;
      }

      if (this.collection.length) {
        const curConn = getCurrentConnection();

        if (curConn && curConn.server && !curConn.server.get('backupWalletWarned')) {
          const warning = openSimpleMessage(
            app.polyglot.t('wallet.transactions.backupWalletWarningTitle'),
            app.polyglot.t('wallet.transactions.backupWalletWarningBody', {
              link: '<a class="js-recoverWalletSeed">' +
                `${app.polyglot.t('wallet.transactions.recoverySeedLink')}</a>`,
            })
          );

          warning.$el.on('click', '.js-recoverWalletSeed', () => {
            launchSettingsModal({
              initialTab: 'Advanced',
              scrollTo: '.js-backupWalletSection',
            });
            warning.remove();
          });

          curConn.server.save({ backupWalletWarned: true });
        }
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
        messageText: app.polyglot.t('wallet.transactions.newTransactionsPopin',
            { refreshLink, smart_count: this.newTransactionCount }),
      });
    } else {
      this.newTransactionPopIn = this.createChild(PopInMessage, {
        messageText: app.polyglot.t('wallet.transactions.newTransactionsPopin',
            { refreshLink, smart_count: this.newTransactionCount }),
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

    this.listenTo(view, 'retrySuccess', e => {
      app.walletBalance.set({
        confirmed: e.data.confirmed,
        unconfirmed: e.data.unconfirmed,
      });

      const transaction = new TransactionMd({
        value: e.data.amount * -1,
        txid: e.data.txid,
        timestamp: e.data.timestamp,
        address: e.data.address,
        memo: e.data.memo,
      }, { parse: true });

      this.collection.unshift(transaction);
    });

    return view;
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    this.popInTimeouts.forEach(timeout => clearTimeout(timeout));
    super.remove();
  }

  get $popInMessages() {
    return this._$popInMessages ||
      (this._$popInMessages = this.$('.js-popInMessages'));
  }

  renderTransactions(models = [], insertionType = 'append') {
    if (!models) {
      throw new Error('Please provide an array of transactions models.');
    }

    if (['append', 'prepend', 'replace'].indexOf(insertionType) === -1) {
      throw new Error('Please provide a valid insertion type.');
    }

    if (insertionType === 'replace') {
      this.transactionViews.forEach(transaction => transaction.remove());
      this.transactionViews = [];
    }

    const transactionsFrag = document.createDocumentFragment();

    models.forEach(transaction => {
      const view = this.createTransactionView(transaction);
      this.transactionViews.push(view);
      view.render().$el.appendTo(transactionsFrag);
    });

    if (insertionType === 'prepend') {
      this.$transactionsContainer.prepend(transactionsFrag);
    } else {
      this.$transactionsContainer.append(transactionsFrag);
    }
  }

  render() {
    this.newTransactionCount = 0;
    this.popInTimeouts.forEach(timeout => clearTimeout(timeout));
    this.popInTimeouts = [];
    if (this.newTransactionPopIn) {
      this.newTransactionPopIn.remove();
      this.newTransactionPopIn = null;
    }

    loadTemplate('modals/wallet/transactions.html', (t) => {
      this.$el.html(t({
        transactions: this.collection.toJSON(),
        isFetching: this.isFetching,
      }));
    });

    this.$transactionsContainer = this.$('.js-transactionListContainer');
    this._$popInMessages = null;
    this._$noTransactions = null;

    this.renderTransactions(this.collection.models, 'replace');

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
