// import $ from 'jquery';
// import { getSocket } from '../../../utils/serverConnect';
// import { recordEvent } from '../../../utils/metrics';
import { isSupportedWalletCur } from '../../../data/cryptoCurrencies';
import { polyTFallback } from '../../../utils/templateHelpers';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import CoinNav from './CoinNav';

export default class extends BaseModal {
  constructor(options = {}) {
    let navCoins = [];

    if (app && app.walletBalances) {
      navCoins = app.walletBalances.toJSON()
        .sort((a, b) => {
          // sort by currency display name, but leave client unsupported coins
          // at the end
          const getSortDisplayName = code => {
            const displayName = polyTFallback(`cryptoCurrencies.${code}`, code);
            return isSupportedWalletCur(code) ?
              displayName : `ZZZZZZZZZZZ${displayName}`;
          };


          const aSortVal = getSortDisplayName(a.code);
          const bSortVal = getSortDisplayName(b.code);

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
      if (this.coinNav) {
        this.coinNav.setState({ active: coin });
      }
    }
  }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
        }));

        super.render();

        console.dir(this.navCoins);

        if (this.coinNav) this.coinNav.remove();
        this.coinNav = this.createChild(CoinNav, {
          initialState: {
            coins: this.navCoins,
            active: this.activeCoin,
          },
        });

        this.getCachedEl('.js-coinNavContainer').html(this.coinNav.render().el);
      });
    });

    return this;
  }
}
