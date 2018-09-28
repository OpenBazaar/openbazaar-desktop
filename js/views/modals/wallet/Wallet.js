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
// import Spend from '../../../models/wallet/Spend';
// import Transactions from '../../../collections/wallet/Transactions';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';
import CoinStats from './CoinStats';
import SendReceiveNav from './SendReceiveNav';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';

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

    const serverSocket = getSocket();

    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // "wallet" sockets come for new transactions and when a transaction gets it's
        // first confirmation. We're only interested in new transactions (i.e. the height will be 0)
        if (e.jsonData.wallet && !e.jsonData.wallet.height) {
          if (this.stats) {
            this.stats.setState({
              transactionCount: this.stats.getState().transactionCount + 1,
            });
          }

          if (this.sendModeOn) {
            // we'll fetch the next time we show the receive money section
            this.needAddress = true;
          } else {
            this.fetchAddress();
          }
        }
      });
    }

    // This should be after all the child views are initialized.
    this.onActiveCoinChange();
  }

  className() {
    return `${super.className()} wallet modalScrollPage`;
  }

  // events() {
  //   return {
  //     'click .js-toggleSendReceive': 'onClickToggleSendReceive',
  //     ...super.events(),
  //   };
  // }

  onActiveCoinChange(coin = this.activeCoin) {
    this.coinNav.setState({ active: coin });
    this.coinStats.setState(this.coinStatsState);
    if (this.needAddress[coin]) {
      this.fetchAddress(coin);
    }
    this.renderSendReceiveVw();
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
      this.onActiveCoinChange();
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
      transactionCount: 28,
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
      return this.addressFetches[coinType];
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

  remove() {
    Object.keys(this.addressFetches)
      .forEach(coinType => {
        this.addressFetches[coinType].forEach(fetch => fetch.abort());
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
      });
    });

    return this;
  }
}
