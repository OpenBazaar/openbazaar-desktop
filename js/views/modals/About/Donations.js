import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { clipboard } from 'electron';

const obDonationAddress = '3MXYUBLWNETa5HTewZp1xMTt7AW9kbFNqs';
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
      'click #copyAddress': 'copyDonationAddress',
      'click #donationAddress': 'copyDonationAddress',
    };
  }

  copyDonationAddress(e) {
    const address = document.querySelector('#donationAddress');
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(address);
    selection.removeAllRanges();
    selection.addRange(range);

    clipboard.writeText(obDonationAddress);

    this.$('#copyNotification').addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer); 
    }
    hiderTimer = setTimeout(
      () => this.$('#copyNotification').removeClass('active'), 3000);
  }

  render() {
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({
        obDonationAddress,
        donationCountFloor,
      }));
    });

    return this;
  }
}

