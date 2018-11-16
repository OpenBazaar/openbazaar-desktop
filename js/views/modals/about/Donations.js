import { clipboard } from 'electron';
import qr from 'qr-encode';
import app from '../../../app';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import {
  isSupportedWalletCur,
  getCurrencyByCode,
} from '../../../data/walletCurrencies';
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
        ...options.initialState,
      },
    };

    super({
      className: 'aboutDonations',
      ...opts,
    });
    this.options = opts;

    const btcAddress = '3EN8kP3yW9MGvyiRMtGqKavQ9wYg4BspzR';
    const btcQRAddress = getCurrencyByCode('BTC').qrCodeText(btcAddress);
    const bchAddress = 'prws8awqjg8l497x3h7qeu6jps4fdmk75vhlng8akj';
    const bchQRAddress = getCurrencyByCode('BCH').qrCodeText(bchAddress);

    this.dCoins = {
      BTC: {
        obDonationAddress: btcAddress,
        qrCodeDataURI: qr(btcQRAddress, { type: 6, size: 6, level: 'Q' }),
        walletSupported: isSupportedWalletCur('BTC'),
      },
      BCH: {
        obDonationAddress: bchAddress,
        qrCodeDataURI: qr(bchQRAddress, { type: 6, size: 6, level: 'Q' }),
        walletSupported: isSupportedWalletCur('BCH'),
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
    const copyNotif = this.getCachedEl('.js-copyNotification');

    copyNotif.addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(() => copyNotif.removeClass('active'), 3000);
  }

  openInWalletClick() {
    let wallet = getWallet();

    if (!wallet) {
      wallet = launchWallet({
        initialActiveCoin: this.getState().showCoin,
        initialSendModeOn: true,
      });
    }

    const sendView = wallet.getSendMoneyVw();

    if (sendView.saveInProgress) {
      openSimpleMessage(
        app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
        app.polyglot.t('about.donationsTab.unableToOpenInWallet.body')
      );
    } else {
      const state = this.getState();
      wallet.activeCoin = state.showCoin;
      wallet.sendModeOn = true;
      wallet.getSendMoneyVw()
        .setFormData({ address: this.dCoins[state.showCoin].obDonationAddress });
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

