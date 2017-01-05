import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

const obDonationAddress = '3MXYUBLWNETa5HTewZp1xMTt7AW9kbFNqs';
const donationCountFloor = 500;

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutDonations',
      ...options,
    });
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

