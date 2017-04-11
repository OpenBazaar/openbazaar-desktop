import $ from 'jquery';
import { getSocket } from '../../../utils/serverConnect';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import Transactions from '../../../collections/Transactions';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';
import Stats from './Stats';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';
import TransactionsVw from './Transactions';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      sendModeOn: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.sendModeOn = opts.sendModeOn;
    this.addressFetches = [];
    this.needAddressFetch = true;

    this.transactions = new Transactions();

    this.listenTo(this.transactions, 'request', (md, xhr) => {
      xhr.done(data => {
        if (this.stats) {
          this.stats.setState({ transactionCount: data.count });
        }
      });
    });

    this.fetchTransactions();

    this.listenTo(app.walletBalance, 'change:confirmed', (md, confirmedAmount) => {
      if (this.stats) {
        this.stats.setState({
          balance: confirmedAmount,
        });
      }
    });

    this.listenTo(app.settings, 'change:localCurrency', (md, curr) => {
      if (this.stats) {
        this.stats.setState({
          userCurrency: curr,
        });
      }
    });

    const serverSocket = getSocket();

    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // "wallet" sockets come for new transactions and when a transaction gets it's
        // first confirmation. We're only listed in new transactions (i.e. the height will be 0)
        if (e.jsonData.wallet && !e.jsonData.height) {
          if (this.sendModeOn) {
            // we'll fetch the next time we show the receive money section
            this.needAddressFetch = true;
          } else {
            this.fetchAddress();
          }
        }
      });
    }
  }

  className() {
    return `${super.className()} wallet modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      ...super.events(),
    };
  }

  onClickToggleSendReceive() {
    this.sendModeOn = !this.sendModeOn;
  }

  set sendModeOn(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a boolean.');
    }

    if (bool !== this._sendModeOn) {
      this.$el.toggleClass('receiveModeOn', !bool);
      this._sendModeOn = bool;

      if (bool && this.sendMoney) {
        this.sendMoney.focusAddress();
      }

      if (!bool && this.needAddressFetch) {
        this.fetchAddress();
      }
    }
  }

  get sendModeOn() {
    return this._sendModeOn;
  }

  /**
   * Set the contents of the Send Money form. Will return
   * true if able to set the form or false otherwise. The most
   * common reason for not being able to set the form is that a
   * send is already in progress.
   */
  setSendFormData(data = {}, options = {}) {
    if (!this.sendMoney) return false;

    if (this.sendMoney.saveInProgress) {
      return false;
    }

    const opts = {
      showSendMode: true,
      // focus will only happen if you showSendMode
      focusAddressInput: true,
      ...options,
    };

    if (opts.showSendMode) this.sendModeOn = true;
    this.sendMoney.setFormData(data, !!opts.focusAddressInput);
    return true;
  }

  fetchAddress() {
    if (this.receiveMoney) {
      this.receiveMoney.setState({
        fetching: true,
      });
    }

    this.needAddressFetch = false;

    let address = '';

    const fetch = $.get(app.getServerUrl('wallet/address/'))
      .done((data) => {
        address = data.address;
      }).always(() => {
        if (this.isRemoved()) return;

        if (this.receiveMoney && !this.isAdressFetching()) {
          this.receiveMoney.setState({
            fetching: false,
            address,
          });
        }
      });

    this.addressFetches.push(fetch);

    return fetch;
  }

  isAdressFetching() {
    if (this.addressFetches) {
      return this.addressFetches.some(fetch => fetch.state() === 'pending');
    }

    return false;
  }

  /**
   * This is used for the initial transactions fetch. Subsequent pages
   * are fetched via the Transactions view.
   */
  fetchTransactions() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    this.transactionsFetch = this.transactions.fetch();

    this.transactionsFetch.always(() => {
      if (this.transactionsVw) {
        this.transactionsVw.setState({
          isFetching: false,
        });
      }
    }).fail((jqXhr) => {
      if (this.transactionsVw) {
        const state = { initialFetchFailed: true };

        if (jqXhr.responseJSON && jqXhr.responseJSON.reason) {
          state.initialFetchErrorMessage = jqXhr.responseJSON.reason;
        }

        this.transactionsVw.setState(state);
      }
    });

    if (this.transactionsVw) {
      this.transactionsVw.setState({
        isFetching: true,
      });
    }
  }

  open() {
    this.sendModeOn = true;

    if (this.sendMoney && !this.sendMoney.saveInProgress) {
      this.sendMoney.clearForm();
    }

    return super.open();
  }

  remove() {
    if (this.transactionsFetch) this.transactionsFetch.abort();
    this.addressFetches.forEach(fetch => fetch.abort());
    super.remove();
  }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
        }));

        super.render();

        if (this.btcTicker) this.btcTicker.remove();
        this.btcTicker = this.createChild(BTCTicker);
        this.$('.js-btcTickerContainer').append(this.btcTicker.render().$el);

        // render the wallet stats
        if (this.stats) this.stats.remove();

        this.stats = this.createChild(Stats, {
          initialState: {
            balance: app.walletBalance.get('confirmed'),
            userCurrency: app.settings.get('localCurrency'),
          },
        });

        this.$('.js-walletStatsContainer').html(this.stats.render().el);

        // render the send money view
        if (this.sendMoney) this.sendMoney.remove();
        this.sendMoney = this.createChild(SendMoney);
        this.$('.js-sendReceiveContainer').html(this.sendMoney.render().el);

        // render the receive money view
        if (this.receiveMoney) this.receiveMoney.remove();

        this.receiveMoney = this.createChild(ReceiveMoney, {
          initialState: {
            fetching: this.isAdressFetching(),
          },
        });

        this.listenTo(this.receiveMoney, 'click-cancel', () => (this.sendModeOn = true));
        this.$('.js-sendReceiveContainer').append(this.receiveMoney.render().el);

        if (this.transactions) this.transactions.remove();

        this.transactionsVw = new TransactionsVw({
          collection: this.transactions,
          initialState: {
            isFetching: this.transactionsFetch.state() === 'pending',
          },
        });

        this.listenTo(this.transactionsVw, 'retryInitialFetchClick',
          () => this.fetchTransactions());
        this.$('.js-transactionContainer').html(this.transactionsVw.render().el);
      });
    });

    return this;
  }
}
