import $ from 'jquery';
import { getSocket } from '../../../utils/serverConnect';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import Transaction from '../../../models/wallet/Transaction';
import Transactions from '../../../collections/WalletTransactions';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';
import Stats from './Stats';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';
import TransactionsVw from './Transactions';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      ...options,
    };

    super(opts);
    this.options = opts;
    this.sendModeOn = true;
    this.addressFetches = [];
    this.needAddressFetch = true;

    this.transactions = new Transactions();

    this.listenTo(this.transactions, 'sync', (md, response) => {
      if (this.stats) {
        this.stats.setState({ transactionCount: response.count });
      }
    });

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
        // first confirmation.
        if (e.jsonData.wallet && !e.jsonData.wallet.height) {
          if (this.stats) {
            this.stats.setState({
              transactionCount: this.stats.getState().transactionCount + 1,
            });
          }

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

  onSpendSuccess(data) {
    if (this.transactionsVw) {
      const transaction = new Transaction({
        value: data.amount * -1,
        txid: data.txid,
        timestamp: data.timestamp,
        address: data.address,
      }, { parse: true });

      this.transactionsVw.collection.unshift(transaction);
    }
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

  open() {
    this.sendModeOn = true;

    if (this.sendMoney && !this.sendMoney.saveInProgress) {
      this.sendMoney.clearForm();

      setTimeout(() => {
        this.sendMoney.focusAddress();
      });
    }

    return super.open();
  }

  remove() {
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
          $scrollContainer: this.$el,
        });

        this.$('.js-transactionContainer').html(this.transactionsVw.render().el);
      });
    });

    return this;
  }
}
