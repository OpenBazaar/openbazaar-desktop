import app from '../../../app';
import { getWallet, launchWallet } from '../../../utils/modalManager';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { clipboard } from 'electron';
import qr from 'qr-encode';

const obDonationAddress = '3QxbMjed45NLXnkUg9yYHRgbKCeLyZa4La';
const qrCodeDataURI = qr(`bitcoin:${obDonationAddress}`, { type: 6, size: 6, level: 'Q' });
const donationCountFloor = 500;
let hiderTimer;

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutDonations',
      ...options,
    });
  }

  events() {
    return {
      'click .js-copyAddress': 'copyDonationAddress',
      'click .js-openInWallet': 'openInWalletClick',
    };
  }

  copyDonationAddress() {
    clipboard.writeText(obDonationAddress);

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
    const wallet = getWallet();

    if (!wallet) {
      launchWallet()
        .setSendFormData({ address: obDonationAddress });
    } else {
      if (wallet.setSendFormData({ address: obDonationAddress })) {
        wallet.open();
      } else {
        openSimpleMessage(app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
          app.polyglot.t('about.donationsTab.unableToOpenInWallet.body'));
      }
    }
  }

  render() {
    console.log(qrCodeDataURI);
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({
        obDonationAddress,
        donationCountFloor,
        qrCodeDataURI,
      }));
    });

    return this;
  }
}

