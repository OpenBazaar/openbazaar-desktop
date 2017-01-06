import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { clipboard } from 'electron';
import QR from 'qr-encode';

const qr = QR;
const obDonationAddress = '3MXYUBLWNETa5HTewZp1xMTt7AW9kbFNqs';
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
    clipboard.writeText(obDonationAddress);

    this.$('.copyNotification').addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(
      () => this.$('.copyNotification').removeClass('active'), 3000);
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

