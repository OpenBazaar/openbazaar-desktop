import _ from 'underscore';
import app from '../../../../app';
import { isScrolledIntoView } from '../../../../utils/dom';
import { getSocket, getCurrentConnection } from '../../../../utils/serverConnect';
import { openSimpleMessage } from '../../SimpleMessage';
import { launchSettingsModal } from '../../../../utils/modalManager';
import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import Transaction from './Transaction';
import TransactionFetchState from './TransactionFetchState';
import PopInMessage, { buildRefreshAlertMessage } from '../../../components/PopInMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      fetchOnInit: true,
      // If not fetching on init, you may want to pass in the count of transactions
      // that were returned by the first fetch which is used to determine if all the
      // pages have been fetched.
      countAtFirstFetch: undefined,
      // If there are any existing bump fee attempts that you want shuttled into the
      // individual transaction views, please provide an indexed object (indexed by txid)
      // of them here.
      bumpFeeXhrs: undefined,
      ...options,
    };

    super(options);
    this.options = opts;

    if (!this.collection) {
      throw new Error('Please provide a Transactions collection.');
    }

    if (!opts.$scrollContainer || !opts.$scrollContainer.length) {
      throw new Error('Please provide a jQuery object containing the scrollable element ' +
        'this view is in.');
    }

    this.transactionViews = [];
    this.fetchFailed = false;
    this.fetchErrorMessage = '';
    this.newTransactionsTXs = new Set();
    this.popInTimeouts = [];
    this.coinType = this.collection.options.coinType;
    this.countAtFirstFetch = opts.countAtFirstFetch;

    this.listenTo(this.collection, 'update', (cl, clUpdateOpts) => {
      if (clUpdateOpts.changes.added.length) {
        // Expecting either a single new transactions on top or a page
        // of transactions on the bottom.
        if (clUpdateOpts.changes.added.length === this.collection.length ||
          clUpdateOpts.changes.added[clUpdateOpts.changes.added.length - 1] ===
            this.collection.at(this.collection.length - 1)) {
          // It's a page of transactions at the bottom
          this.renderTransactions(clUpdateOpts.changes.added, 'append');
        } else {
          // New transaction at top
          this.renderTransactions(clUpdateOpts.changes.added, 'prepend');
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
        // first confirmation.
        if (e.jsonData.wallet && e.jsonData.wallet.wallet === this.coinType) {
          const transaction = this.collection.get(e.jsonData.wallet.txid);

          if (transaction) {
            // existing transaction has been confirmed
            transaction.set(transaction.parse(_.omit(e.jsonData.wallet, 'wallet')));
          } else {
            // new transaction
            this.newTransactionsTXs.add(e.jsonData.wallet.txid);

            // This is a bit ugly... but most incoming transactions (ones sent via our UI)
            // are immediately added to the list when their respective APIs succeeds and
            // therefore should not be included in the "new transactions" pop in count.
            // But, at this point we don't know if these are such transactions, so we'll
            // check back in a bit and see if they've already been added or not. It's a matter
            // of the socket coming in before the AJAX call returns.
            const timeout = setTimeout(() => {
              if (this.collection.get(e.jsonData.wallet.txid)) {
                this.newTransactionsTXs.delete(e.jsonData.wallet.txid);
              } else {
                this.showNewTransactionPopup();
              }
            }, 1500);

            this.popInTimeouts.push(timeout);
          }
        }

        // The "walletUpdate" socket comes on a regular interval and gives us the current block
        // height which we can use to update the confirmations on a transaction.
        if (e.jsonData.walletUpdate && e.jsonData.walletUpdate[this.coinType]) {
          const walletUpdate = e.jsonData.walletUpdate[this.coinType];
          this.collection.models
            .filter(transaction => (transaction.get('height') > 0))
            .forEach(transaction => {
              const confirmations =
                walletUpdate.height - transaction.get('height') + 1;
              transaction.set('confirmations', confirmations);
            });
        }
      });
    }

    this.$scrollContainer = opts.$scrollContainer;
    this.throttledOnScroll = _.throttle(this.onScroll, 100).bind(this);

    if (opts.fetchOnInit) this.fetchTransactions();
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
    if (this.transactionsFetch &&
      this.transactionsFetch.state() === 'pending') return;

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

    this.transactionsFetch
      .done(data => {
        if (this.isRemoved()) return;

        this.fetchFailed = false;
        this.fetchErrorMessage = '';

        if (typeof this.countAtFirstFetch === 'undefined') {
          this.countAtFirstFetch = data.count;
        }

        if (this.collection.length) {
          this.transactionFetchState.setState({
            isFetching: false,
            fetchFailed: this.fetchFailed,
            fetchErrorMessage: this.fetchErrorMessage,
          });

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
        } else {
          this.render();
        }
      }).fail(xhr => {
        if (this.isRemoved() || xhr.statusText === 'abort') return;

        this.fetchFailed = true;
        this.fetchErrorMessage = xhr.responseJSON && xhr.responseJSON.reason || '';

        if (this.collection.length) {
          this.transactionFetchState.setState({
            isFetching: false,
            fetchFailed: this.fetchFailed,
            fetchErrorMessage: this.fetchErrorMessage,
          });
        } else {
          this.render();
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
    this.$popInMessages.toggleClass('notFixed', this.$scrollContainer[0].scrollTop < 515);
  }

  showNewTransactionPopup() {
    if (this.newTransactionPopIn && !this.newTransactionPopIn.isRemoved()) {
      this.newTransactionPopIn.setState({
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('wallet.transactions.newTransactionsPopin',
            { smart_count: this.newTransactionsTXs.size })),
      });
    } else {
      this.newTransactionPopIn = this.createChild(PopInMessage, {
        messageText:
          buildRefreshAlertMessage(app.polyglot.t('wallet.transactions.newTransactionsPopin',
            { smart_count: this.newTransactionsTXs.size })),
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
      coinType: this.coinType,
      bumpFeeXhr: this.options.bumpFeeXhrs &&
        this.options.bumpFeeXhrs[model.id] || undefined,
      ...options,
    });

    this.listenTo(view, 'bumpFeeSuccess', e =>
      this.trigger('bumpFeeSuccess', e));

    this.listenTo(view, 'bumpFeeAttempt', e =>
      this.trigger('bumpFeeAttempt', e));

    return view;
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    this.popInTimeouts.forEach(timeout => clearTimeout(timeout));
    this.$scrollContainer.off('scroll', this.throttledOnScroll);
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
    this.newTransactionsTXs.clear();
    this.popInTimeouts.forEach(timeout => clearTimeout(timeout));
    this.popInTimeouts = [];
    if (this.newTransactionPopIn) {
      this.newTransactionPopIn.remove();
      this.newTransactionPopIn = null;
    }

    loadTemplate('modals/wallet/transactions/transactions.html', (t) => {
      this.$el.html(t({
        transactions: this.collection.toJSON(),
        isFetching: this.isFetching,
        fetchFailed: this.fetchFailed,
        coinType: this.coinType,
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
    this.listenTo(this.transactionFetchState, 'clickRetryFetch', () => {
      // simulate some latency so if it fails again, it looks like it tried.
      this.transactionFetchState.setState({ isFetching: true });
      setTimeout(() => this.fetchTransactions(), 250);
    });

    return this;
  }
}
