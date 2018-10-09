import _ from 'underscore';
import $ from 'jquery';
import { getSocket } from '../../../utils/serverConnect';
// import { recordEvent } from '../../../utils/metrics';
import {
  isSupportedWalletCur,
  ensureMainnetCode,
} from '../../../data/walletCurrencies';
import { polyTFallback } from '../../../utils/templateHelpers';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import Transactions from '../../../collections/wallet/Transactions';
import TransactionMd from '../../../models/wallet/Transaction';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';
import CoinStats from './CoinStats';
import SendReceiveNav from './SendReceiveNav';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';
import TransactionsVw from './transactions/Transactions';
import ReloadTransactions from './ReloadTransactions';

export default class extends BaseModal {
  constructor(options = {}) {
    let navCoins = [];

    if (app && app.walletBalances) {
      navCoins = app.walletBalances.toJSON()
        .filter(balanceObj => isSupportedWalletCur(balanceObj.code))
        .sort((a, b) => {
          const getDisplayName = code => polyTFallback(`cryptoCurrencies.${code}`, code);


          const aSortVal = getDisplayName(a.code);
          const bSortVal = getDisplayName(b.code);

          if (aSortVal < bSortVal) return -1;
          if (aSortVal > bSortVal) return 1;
          return 0;
        });
    }

    const initialActiveCoin = navCoins.length && navCoins[0] &&
        navCoins[0].code || 'BTC';
    const opts = {
      initialActiveCoin,
      initialSendModeOn: true,
      ...options,
    };

    super(opts);
    this._activeCoin = opts.initialActiveCoin;
    this._sendModeOn = opts.initialSendModeOn;
    this._sendMoneyVws = {};
    this._receiveMoneyVws = {};
    this.addressFetches = {};
    this.needAddress = navCoins.reduce((acc, coin) => {
      acc[coin.code] = true;
      return acc;
    }, {});
    // The majority of the TransactionsVw state is managed within the component, but
    // some of it we'll manage so as you nav from coin to coin, certain state is maintained.
    this.transactionsState = {};

    this.navCoins = navCoins.map(coin => {
      const code = coin.code;

      return {
        active: code === opts.initialNavCoin,
        code,
        name: polyTFallback(`cryptoCurrencies.${code}`, code),
        balance: coin.confirmed,
      };
    });

    this.coinNav = this.createChild(CoinNav, {
      initialState: {
        coins: this.navCoins,
        active: this.activeCoin,
      },
    }).render();

    this.listenTo(this.coinNav, 'coinSelected', e => {
      this.activeCoin = e.code;
    });

    this.coinStats = this.createChild(CoinStats, {
      initialState: this.coinStatsState,
    }).render();

    this.sendReceiveNav = this.createChild(SendReceiveNav, {
      initialState: this.sendReceivNavState,
    }).render();

    this.listenTo(this.sendReceiveNav, 'click-send', () => {
      this.sendModeOn = true;
    });

    this.listenTo(this.sendReceiveNav, 'click-receive', () => {
      this.sendModeOn = false;
    });

    this.reloadTransactions = this.createChild(ReloadTransactions, {
      initialState: {
        coinType: this.activeCoin,
      },
    }).render();

    const serverSocket = getSocket();

    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        if (e.jsonData.wallet) {
          if (!e.jsonData.wallet.height) {
            // new transactions

            if (e.jsonData.wallet.value > 0) {
              // for incoming new transactions, we'll need a new receiving address
              if (this.activeCoin === e.jsonData.wallet.wallet) {
                this.fetchAddress();
              } else {
                this.needAddress[e.jsonData.wallet.wallet] = true;
              }
            }

            const cl = this.transactionsState[e.jsonData.wallet.wallet] &&
              this.transactionsState[e.jsonData.wallet.wallet].cl || null;
            if (cl && this.activeCoin !== e.jsonData.wallet.wallet) {
              // If this is a new / updated transaction for the active coin, we'll
              // do nothing since the transactionsVw will handle updating the collection
              // and UI. Otherwise, we'll update the collection here.
              const transaction = cl.get(e.jsonData.wallet.txid);
              const data = _.omit(e.jsonData.wallet, 'wallet');

              if (transaction) {
                // existing transaction has been confirmed
                transaction.set(transaction.parse(data));
              } else {
                cl.add(data, { parse: true, at: 0 });
              }
            }
          }
        }
      });
    }

    this.listenTo(app.settings, 'change:localCurrency', (md, curr) => {
      if (this.coinNav) {
        this.coinNav.setState({
          displayCur: curr,
        });
      }

      if (this.coinStats) {
        this.coinStats.setState({
          displayCur: curr,
        });
      }
    });

    app.walletBalances.forEach(balanceMd => {
      this.listenTo(balanceMd, 'change:confirmed change:unconfirmed',
        _.debounce(this.onBalanceChange, 1));
    });

    this.fetchAddress();
  }

  className() {
    return `${super.className()} wallet modalScrollPage`;
  }

  onBalanceChange(md) {
    if (md.id === this.activeCoin) {
      this.coinStats.setState({
        confirmed: md.get('confirmed'),
        unconfirmed: md.get('unconfirmed'),
      });
    }

    this.navCoins = this.navCoins.map(navCoin => ({
      ...navCoin,
      balance: md.id === navCoin.code ?
        md.get('confirmed') : navCoin.balance,
    }));

    this.coinNav.setState({ coins: this.navCoins });
  }

  /**
   * Indicates which coin is currently active. The remaining interface (coinStats,
   * Send/Receive, Transactions, etc...) will be in the context of this coin.
   */
  get activeCoin() {
    return this._activeCoin;
  }

  set activeCoin(coin) {
    if (coin !== this._activeCoin) {
      this._activeCoin = coin;
      this.coinNav.setState({ active: coin });
      this.coinStats.setState(this.coinStatsState);
      if (this.needAddress[coin]) {
        this.fetchAddress(coin);
      }
      this.renderSendReceiveVw();
      this.renderTransactionsView();
      this.reloadTransactions.setState({
        coinType: coin,
      });
    }
  }

  /**
   * True indicates that the wallet interface has the Send tab (as opposed to Recieve)
   * active for the selected activeCoin.
   */
  get sendModeOn() {
    return this._sendModeOn;
  }

  set sendModeOn(bool) {
    const normalizedBool = !!bool;

    if (normalizedBool !== this._sendModeOn) {
      this._sendModeOn = normalizedBool;
      this.sendReceiveNav.setState(this.sendReceivNavState);
      this.renderSendReceiveVw();
    }
  }

  get coinStatsState() {
    const activeCoin = this.activeCoin;
    const balance = app && app.walletBalances &&
      app.walletBalances.get(activeCoin);

    return {
      cryptoCur: ensureMainnetCode(activeCoin),
      displayCur: app && app.settings && app.settings.get('localCurrency') ||
        'USD',
      confirmed: balance && balance.get('confirmed'),
      unconfirmed: balance && balance.get('unconfirmed'),
      transactionCount: this.transactionsState && this.transactionsState[activeCoin] &&
        this.transactionsState[activeCoin].cl ?
          this.transactionsState[activeCoin].cl.length : undefined,
    };
  }

  get sendReceivNavState() {
    return { sendModeOn: this.sendModeOn };
  }

  getSendMoneyVw(coinType = this.activeCoin) {
    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    if (this._sendMoneyVws[coinType]) {
      return this._sendMoneyVws[coinType];
    }

    this._sendMoneyVws[coinType] = this.createChild(SendMoney, {
      coinType,
    })
      .render();

    return this._sendMoneyVws[coinType];
  }

  getReceiveMoneyVw(coinType = this.activeCoin) {
    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    if (this._receiveMoneyVws[coinType]) {
      return this._receiveMoneyVws[coinType];
    }

    this._receiveMoneyVws[coinType] = this.createChild(ReceiveMoney, {
      initialState: { coinType },
    })
      .render();

    return this._receiveMoneyVws[coinType];
  }

  fetchAddress(coinType = this.activeCoin) {
    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    if (this.addressFetches[coinType]) {
      const pendingFetch = this.addressFetches[coinType]
        .find(xhr => xhr.state() === 'pending');
      if (pendingFetch) return pendingFetch;
    }

    const receiveMoneyVw = this.getReceiveMoneyVw(coinType);

    if (receiveMoneyVw) {
      receiveMoneyVw.setState({
        fetching: true,
      });
    }

    this.needAddress[coinType] = false;

    const fetch = $.get(app.getServerUrl(`wallet/address/${coinType}`))
      .done((data) => {
        if (receiveMoneyVw && !receiveMoneyVw.isRemoved()) {
          receiveMoneyVw.setState({
            fetching: false,
            address: data.address,
          });
        }
      }).fail(xhr => {
        if (xhr.statusText === 'abort') return;
        this.needAddress[coinType] = true;
        if (receiveMoneyVw && !receiveMoneyVw.isRemoved()) {
          receiveMoneyVw.setState({
            fetching: false,
          });
        }
      });

    this.addressFetches[coinType] = this.addressFetches[coinType] || [];
    this.addressFetches[coinType].push(fetch);

    return fetch;
  }

  open(...args) {
    const returnVal = super.open(...args);
    if (this.sendModeOn) {
      const sendVw = this.getSendMoneyVw();
      if (sendVw) sendVw.focusAddress();
    }
    return returnVal;
  }

  remove() {
    Object.keys(this.addressFetches)
      .forEach(coinType => {
        this.addressFetches[coinType].forEach(fetch => fetch.abort());
      });
    Object.keys(this.transactionsState)
      .forEach(coinType => {
        if (this.transactionsState[coinType] &&
          typeof this.transactionsState[coinType].bumpFeeAttempts === 'object') {
          Object.keys(this.transactionsState[coinType].bumpFeeAttempts)
            .forEach(txId =>
              this.transactionsState[coinType]
                .bumpFeeAttempts[txId].abort());
        }
      });
    super.remove();
  }

  renderSendReceiveVw() {
    if (this.sendModeOn) {
      const sendVw = this.getSendMoneyVw();
      sendVw.delegateEvents();
      this.getCachedEl('.js-sendReceiveContainer')
        .html(sendVw.el);

      // select2 shits the bed if it's removed and re-insertd into the dom -
      // hence the re-render below with extra hoops to maintain state
      // (e.g. form data). <shaking-fist-at-select2 />
      const modelErrors = sendVw.model.validationError;
      sendVw.setFormData(sendVw.getFormData(), { render: false });
      sendVw.model.validationError = modelErrors;
      sendVw.render();
    } else {
      const receiveVw = this.getReceiveMoneyVw();
      receiveVw.delegateEvents();
      this.getCachedEl('.js-sendReceiveContainer')
        .html(receiveVw.el);
    }
  }

  renderTransactionsView() {
    const activeCoin = this.activeCoin;
    const transactionsState = this.transactionsState[activeCoin] || {};
    let cl = transactionsState && transactionsState.cl;

    if (!cl) {
      cl = transactionsState.cl =
        new Transactions([], { coinType: activeCoin });

      this.coinStats.setState({ transactionCount: undefined });

      this.listenTo(cl, 'sync', (md, response, options) => {
        if (options && options.xhr) {
          options.xhr.done(data => {
            transactionsState.initialFetchComplete = true;
            transactionsState.countAtFirstFetch = data.count;
          });
        }

        if (this.activeCoin === activeCoin && !cl.length) {
          this.coinStats.setState({ transactionCount: 0 });
        }
      });

      this.listenTo(cl, 'update', () => {
        if (this.activeCoin === activeCoin) {
          this.coinStats.setState({ transactionCount: cl.length });
        }
      });
    }

    if (this.transactionsVw) this.transactionsVw.remove();
    this.transactionsVw = this.createChild(TransactionsVw, {
      collection: cl,
      $scrollContainer: this.$el,
      fetchOnInit: !transactionsState.initialFetchComplete,
      countAtFirstFetch: transactionsState.countAtFirstFetch,
      bumpFeeXhrs: transactionsState.bumpFeeAttempts || undefined,
    });
    this.getCachedEl('.js-transactionsContainer')
      .html(this.transactionsVw.render().el);

    this.listenTo(this.transactionsVw, 'bumpFeeAttempt', e => {
      transactionsState.bumpFeeAttempts =
        transactionsState.bumpFeeAttempts || {};
      transactionsState.bumpFeeAttempts[e.md.id] = e.xhr;
    });

    this.listenTo(this.transactionsVw, 'bumpFeeSuccess', e => {
      app.walletBalances.get(activeCoin).set({
        confirmed: e.data.confirmed,
        unconfirmed: e.data.unconfirmed,
      });

      cl.add({
        value: e.data.amount * -1,
        txid: e.data.txid,
        timestamp: e.data.timestamp,
        address: e.data.address,
        memo: e.data.memo,
      }, {
        parse: true,
        at: 0,
      });
    });

    this.transactionsState[activeCoin] = transactionsState;
  }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
        }));

        super.render();

        this.coinNav.delegateEvents();
        this.getCachedEl('.js-coinNavContainer').html(this.coinNav.el);

        this.coinStats.delegateEvents();
        this.getCachedEl('.js-coinStatsContainer').html(this.coinStats.el);

        this.sendReceiveNav.delegateEvents();
        this.getCachedEl('.js-sendReceiveNavContainer').html(this.sendReceiveNav.el);

        this.renderSendReceiveVw();
        this.renderTransactionsView();

        this.reloadTransactions.delegateEvents();
        this.getCachedEl('.js-reloadTransactionsContainer')
          .html(this.reloadTransactions.el);
      });
    });

    return this;
  }
}
