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
    };
  }

  copyDonationAddress() {
    const $copyNotification = this.$('.js-copyNotification');
    clipboard.writeText(obDonationAddress);

    $copyNotification.addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(
      () => $copyNotification.removeClass('active'), 3000);
  }

  render() {
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

