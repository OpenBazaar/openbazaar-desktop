import { isSupportedWalletCur } from '../../../data/walletCurrencies';
import { getWallet, launchWallet } from '../../../utils/modalManager';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { clipboard } from 'electron';
import qr from 'qr-encode';



// const obDonationAddress = '3EN8kP3yW9MGvyiRMtGqKavQ9wYg4BspzR';
// const qrCodeDataURI = qr(`bitcoin:${obDonationAddress}`, { type: 6, size: 6, level: 'Q' });
const btcAddress = '3EN8kP3yW9MGvyiRMtGqKavQ9wYg4BspzR';
const bchAddress = 'foo';
const donationCountFloor = 500;
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

    this.donationAddresses = {
      BTC: {
        address: btcAddress,
        qrCodeDataURI: qr(`bitcoin:${btcAddress}`,
          { type: 6, size: 6, level: 'Q' }),
      },
      BCH: {
        address: bchAddress,
        qrCodeDataURI: qr(`bitcoin:${bchAddress}`,
          { type: 6, size: 6, level: 'Q' }),
      }
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
    this.setState({ showCoin:'BTC'});
  };

  showBCH() {
    this.setState({ showCoin: 'BCH'});
  }

  copyDonationAddress() {
    addr = this.donationAddresses[this.getState().showCoin].address;
    clipboard.writeText(addr);

    this.$copyNotification.addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(
      () => this.$copyNotification.removeClass('active'), 3000);
  }

  get $copyNotification() {
    return this._$copyNotification ||
      (this._$copyNotification = this.$('.js-copyNotification'));
  }

  openInWalletClick() {
    const coin = this.getState().showCoin;
    // This is very unlikely to happen unless the user manually disabled some of
    // their wallets.
    if (!isSupportedWalletCur(coin)) {
      openSimpleMessage(app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
        app.polyglot.t('about.donationsTab.unableToOpenInWallet.body'));
      return;
    }
    const wallet = getWallet();
    if (!wallet) {
      launchWallet({
        initialActiveCoin: this.getState().showCoin,
        // TODO: add send address here
      })
        //.setSendFormData({ address: obDonationAddress });
    } else {
      /*
      * Do we still need a check to see if the wallet is in the middle of
      * sending a payment here? If so, show this error message:
      * openSimpleMessage(app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
       app.polyglot.t('about.donationsTab.unableToOpenInWallet.body'));
      * */
      wallet.activeCoin = this.getState().showCoin;
      // TODO: add send address here
      wallet.open();
    }
  }

  render() {
    const showCoin = this.getState().showCoin;
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({
        obDonationAddress: this.donationAddresses[showCoin].address,
        qrCodeDataURI: this.donationAddresses[showCoin].qrCodeDataURI,
        donationCountFloor,
        showCoin,
      }));
    });

    return this;
  }
}

