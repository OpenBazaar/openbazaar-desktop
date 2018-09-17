// import $ from 'jquery';
// import { getSocket } from '../../../utils/serverConnect';
// import { recordEvent } from '../../../utils/metrics';
import { isSupportedWalletCur } from '../../../data/cryptoCurrencies';
import { polyTFallback } from '../../../utils/templateHelpers';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import Spend from '../../../models/wallet/Spend';
import Transactions from '../../../collections/wallet/Transactions';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';

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

    const opts = {
      initialActiveCoin: navCoins.length && navCoins[0] &&
        navCoins[0].code || 'BTC',
      ...options,
    };

    super(opts);
    this._activeCoin = opts.initialActiveCoin;
    this.navCoins = navCoins.map(coin => {
      const code = coin.code;

      return {
        active: code === opts.initialNavCoin,
        code,
        name: polyTFallback(`cryptoCurrencies.${code}`, code),
        balance: coin.confirmed,
      };
    });

    this.navCoins.forEach(coin => {
      const code = coin.code;
      console.log(`${code}Spend`);
      window[`${code}Spend`] = this[`${code}Spend`] = new Spend({ wallet: code });
      console.log(`${code}Transactions`);
      window[`${code}Transactions`] = this[`${code}Transactions`] =
        new Transactions([], { coinType: code });
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

  // remove() {
  //   this.addressFetches.forEach(fetch => fetch.abort());
  //   super.remove();
  // }

  get activeCoin() {
    return this._activeCoin;
  }

  set activeCoin(coin) {
    if (coin !== this._activeCoin) {
      this._activeCoin = coin;
      this.coinNav.setState({ active: coin });
      this.setState({
        transactionCoin: coin,
      });
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

        // const transactions = this[`${this.getState().transactionCoin}Transactions`];

        this[app.serverConfig.testnet ? 'TBTCTransactions' : 'BTCTransactions'].fetch();

        // if (transactions) {
        //   // this.getCachedEl('.js-transactions').html()
        // }
        // js-btcTransactions
      });
    });

    return this;
  }
}
