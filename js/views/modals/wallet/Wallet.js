import _ from 'underscore';
import $ from 'jquery';
import {
  isSupportedWalletCur,
  ensureMainnetCode,
  supportedWalletCurs,
} from '../../../data/walletCurrencies';
import defaultSearchProviders from '../../../data/defaultSearchProviders';
import { recordEvent } from '../../../utils/metrics';
import { getSocket } from '../../../utils/serverConnect';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { launchEditListingModal } from '../../../utils/modalManager';
import Transactions from '../../../collections/wallet/Transactions';
import Listing from '../../../models/listing/Listing';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';
import CoinStats from './CoinStats';
import SendReceiveNav from './SendReceiveNav';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';
import TransactionsVw from './transactions/Transactions';
import ReloadTransactions from './ReloadTransactions';
import CryptoTicker from '../../components/CryptoTicker';

export default class extends BaseModal {
  constructor(options = {}) {
    const navCoins = supportedWalletCurs({ clientSupported: false })
      .sort((a, b) => {
        const aSortVal =
          app.polyglot.t(`cryptoCurrencies.${a}`, { _: a });
        const bSortVal =
          app.polyglot.t(`cryptoCurrencies.${b}`, { _: b });

        return aSortVal.localeCompare(
          bSortVal,
          app.localSettings.standardizedTranslatedLang(),
          { sensitivity: 'base' }
        );
      });

    let initialActiveCoin;

    if (options.initialActiveCoin &&
      typeof options.initialActiveCoin === 'string') {
      initialActiveCoin = isSupportedWalletCur(options.initialActiveCoin) ?
        options.initialActiveCoin : null;
    }

    if (!initialActiveCoin) {
      initialActiveCoin = navCoins.find(coin => isSupportedWalletCur(coin)) || null;
    }

    // If at this point the initialActiveCoin and consequently this.activeCoin
    // are null, it indicates that none of the wallet currencies are supported by
    // this client.

    const opts = {
      initialSendModeOn: app.walletBalances.get(initialActiveCoin) &&
        app.walletBalances.get(initialActiveCoin).get('confirmed') || false,
      ...options,
      initialActiveCoin,
    };

    super(opts);
    this._activeCoin = opts.initialActiveCoin;
    this._sendModeOn = opts.initialSendModeOn;
    this._sendMoneyVws = {};
    this._receiveMoneyVws = {};
    this.addressFetches = {};
    this.needAddress = navCoins.reduce((acc, coin) => {
      acc[coin] = true;
      return acc;
    }, {});
    // The majority of the TransactionsVw state is managed within the component, but
    // some of it we'll manage so as you nav from coin to coin, certain state is maintained.
    this.transactionsState = {};

    this.navCoins = navCoins.map(coin => ({
      active: coin === opts.initialNavCoin,
      code: coin,
      name: app.polyglot.t(`cryptoCurrencies.${coin}`, { _: coin }),
      balance: app.walletBalances.get(coin) ? app.walletBalances.get(coin).get('confirmed') : 0,
      clientSupported: isSupportedWalletCur(coin),
    }));

    this.coinNav = this.createChild(CoinNav, {
      initialState: {
        coins: this.navCoins,
        active: this.activeCoin,
      },
    }).render();

    this.listenTo(this.coinNav, 'coinSelected', e => {
      this.activeCoin = e.code;
    });

    if (initialActiveCoin) {
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

      this.ticker = this.createChild(CryptoTicker, {
        initialState: {
          coinType: this.activeCoin,
        },
      }).render();
    }

    const ob1ProviderData = defaultSearchProviders.find(provider => provider.id === 'ob1');
    this.viewCryptoListingsUrl = ob1ProviderData ?
      `#search?providerQ=${ob1ProviderData.search}/listings?type=cryptocurrency` :
      null;

    const serverSocket = getSocket();

    if (initialActiveCoin && serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        if (e.jsonData.wallet) {
          const cl = this.transactionsState[e.jsonData.wallet.wallet] &&
            this.transactionsState[e.jsonData.wallet.wallet].cl || null;

          if (cl) {
            const transaction = cl.get(e.jsonData.wallet.txid);

            if (this.activeCoin !== e.jsonData.wallet.wallet) {
              // If this is a new / updated transaction for the active coin, we won't
              // update the collection since the transactionsVw will handle that. Otherwise,
              // we'll update the collection here.
              const data = _.omit(e.jsonData.wallet, 'wallet');

              if (transaction) {
                // existing transaction has been confirmed
                transaction.set(transaction.parse(data));
              } else {
                cl.add(data, { parse: true, at: 0 });
              }
            }

            if (!transaction) {
              this.incrementCountAtFirstFetch(e.jsonData.wallet.wallet);
            }
          }

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

    if (initialActiveCoin) this.fetchAddress();
  }

  className() {
    return `${super.className()} wallet modalScrollPage`;
  }

  events() {
    return {
      'click .js-createListing': 'onClickCreateListing',
      'click .js-viewCryptoListings': 'onClickViewCryptoListings',
      ...super.events(),
    };
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

  onClickCreateListing() {
    const model = new Listing({
      metadata: {
        contractType: 'CRYPTOCURRENCY',
      },
    });

    recordEvent('Listing_NewCryptoFromWallet');

    launchEditListingModal({ model });
  }

  onClickViewCryptoListings() {
    recordEvent('Wallet_ViewCryptoListings');
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

      if (
        this.sendModeOn &&
        !(
          app.walletBalances.get(coin) &&
            app.walletBalances.get(coin).get('confirmed')
        )
      ) {
        this.sendModeOn = false;
      }

      this.ticker.setState({ coinType: this.activeCoin });
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
      transactionCount: this.transactionsState && this.transactionsState[activeCoin] ?
        this.transactionsState[activeCoin].countAtFirstFetch : undefined,
    };
  }

  get sendReceivNavState() {
    return { sendModeOn: this.sendModeOn };
  }

  checkCoinType(coinType) {
    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }
  }

  getSendMoneyVw(coinType = this.activeCoin) {
    this.checkCoinType(coinType);

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
    this.checkCoinType(coinType);

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
    this.checkCoinType(coinType);

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

  getCountAtFirstFetch(coinType = this.activeCoin) {
    this.checkCoinType(coinType);

    return this.transactionsState[coinType] &&
      this.transactionsState[coinType].countAtFirstFetch;
  }

  setCountAtFirstFetch(count, coinType = this.activeCoin) {
    if (typeof count !== 'number') {
      throw new Error('Please provide a count as a number.');
    }

    this.checkCoinType(coinType);

    if (!this.transactionsState[coinType] ||
      this.transactionsState[coinType].countAtFirstFetch !== count) {
      this.transactionsState[coinType] = this.transactionsState[coinType] || {};
      this.transactionsState[coinType].countAtFirstFetch = count;

      if (coinType === this.activeCoin) {
        this.coinStats.setState({ transactionCount: count });
      }
    }
  }

  incrementCountAtFirstFetch(coinType = this.activeCoin) {
    this.checkCoinType(coinType);
    const curCount = this.getCountAtFirstFetch(coinType);

    this.setCountAtFirstFetch(
      typeof curCount === 'number' ? curCount + 1 : 1,
      coinType
    );
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

      this.listenToOnce(cl, 'sync', (md, response, options) => {
        if (options && options.xhr) {
          options.xhr.done(data => {
            transactionsState.initialFetchComplete = true;
            this.setCountAtFirstFetch(data.count, activeCoin);
          });
        }
      });

      this.listenToOnce(cl, 'reset', () => {
        this.listenToOnce(cl, 'sync', (md, response, options) => {
          if (options && options.xhr) {
            options.xhr.done(data => {
              this.setCountAtFirstFetch(data.count, activeCoin);
            });
          }
        });
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

      this.incrementCountAtFirstFetch(activeCoin);
    });

    this.transactionsState[activeCoin] = transactionsState;
  }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', walletIconTmpl => {
        loadTemplate('modals/wallet/cryptoListingsTeaser.html', cryptoTeaserT => {
          this.$el.html(t({
            walletIconTmpl,
            cryptoTeaserHtml: cryptoTeaserT({
              viewCryptoListingsUrl: this.viewCryptoListingsUrl,
            }),
            activeCoin: this.activeCoin,
          }));

          super.render();

          this.coinNav.delegateEvents();
          this.getCachedEl('.js-coinNavContainer').html(this.coinNav.el);

          if (this.activeCoin) {
            this.coinStats.delegateEvents();
            this.getCachedEl('.js-coinStatsContainer').html(this.coinStats.el);

            this.sendReceiveNav.delegateEvents();
            this.getCachedEl('.js-sendReceiveNavContainer').html(this.sendReceiveNav.el);

            this.renderSendReceiveVw();
            this.renderTransactionsView();

            this.reloadTransactions.delegateEvents();
            this.getCachedEl('.js-reloadTransactionsContainer')
              .html(this.reloadTransactions.el);

            this.ticker.delegateEvents();
            this.getCachedEl('.js-tickerContainer')
              .html(this.ticker.el);
          }
        });
      });
    });

    return this;
  }
}
