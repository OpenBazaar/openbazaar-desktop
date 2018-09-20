// import $ from 'jquery';
// import { getSocket } from '../../../utils/serverConnect';
// import { recordEvent } from '../../../utils/metrics';
import { isSupportedWalletCur } from '../../../data/walletCurrencies';
import { polyTFallback } from '../../../utils/templateHelpers';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
// import Spend from '../../../models/wallet/Spend';
// import Transactions from '../../../collections/wallet/Transactions';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';
import CoinStats from './CoinStats';

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

    // this.navCoins.forEach(coin => {
    //   const code = coin.code;
    //   console.log(`${code}Spend`);
    //   window[`${code}Spend`] = this[`${code}Spend`] = new Spend({ wallet: code });
    //   console.log(`${code}Transactions`);
    //   window[`${code}Transactions`] = this[`${code}Transactions`] =
    //     new Transactions([], { coinType: code });
    //   this.listenTo(this[`${code}Transactions`], 'update', () => {
    //     this.render();
    //   });
    // });

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
      initialState: {
        cryptoCur: 'BTC',
        displayCur: 'USD',
        balance: 1.567,
        transactionCount: 28,
      },
    }).render();
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
      });
    });

    return this;
  }
}
