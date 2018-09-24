import { clipboard } from 'electron';
import qr from 'qr-encode';
import { isSupportedWalletCur } from '../../../data/walletCurrencies';
import { getWallet, launchWallet } from '../../../utils/modalManager';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';


let hiderTimer;

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        showCoin: 'BTC',
      },
      ...options.initialState,
    };

    super({
      className: 'aboutDonations',
      ...opts,
    });
    this.options = opts;

    const btcAddress = '3EN8kP3yW9MGvyiRMtGqKavQ9wYg4BspzR';
    const bchAddress = 'prws8awqjg8l497x3h7qeu6jps4fdmk75vhlng8akj';

    this.dCoins = {
      BTC: {
        obDonationAddress: btcAddress,
        qrCodeDataURI: qr(`bitcoin:${btcAddress}`,
          { type: 6, size: 6, level: 'Q' }),
        supported: isSupportedWalletCur('BTC'),
      },
      BCH: {
        obDonationAddress: bchAddress,
        qrCodeDataURI: qr(`bitcoin:${bchAddress}`,
          { type: 6, size: 6, level: 'Q' }),
        supported: isSupportedWalletCur('BCH'),
      },
    };
  }

  events() {
    return {
      'click .js-copyAddress': 'copyDonationAddress',
      'click .js-openInWallet': 'openInWalletClick',
      'click .js-btc': 'showBTC',
      'click .js-bch': 'showBCH',
    };
  }

  showBTC() {
    this.setState({ showCoin: 'BTC' });
  }

  showBCH() {
    this.setState({ showCoin: 'BCH' });
  }

  copyDonationAddress() {
    const addr = this.dCoins[this.getState().showCoin].obDonationAddress;
    clipboard.writeText(addr);

    this.getCachedEl('.js-copyNotification').addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(
      () => this.getCachedEl('.js-copyNotification')
        .removeClass('active'), 3000);
  }

  openInWalletClick() {
    const wallet = getWallet();
    if (!wallet) {
      launchWallet({
        initialActiveCoin: this.getState().showCoin,
        // TODO: add send address here
      });
    } else {
      /*
      * We probably still need a check to see if the wallet is in the middle of
      * sending a payment here. If so, use the API provided to check and show
      * this error message: openSimpleMessage(
      * app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
      * app.polyglot.t('about.donationsTab.unableToOpenInWallet.body'));
      * The phrases will need to be added back to en_US.json
      * */
      wallet.activeCoin = this.getState().showCoin;
      // TODO: add send address here
      wallet.open();
    }
  }

  render() {
    super.render();
    const showCoin = this.getState().showCoin;
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({
        showCoin,
        ...this.dCoins[showCoin],
      }));
    });

    return this;
  }
}

