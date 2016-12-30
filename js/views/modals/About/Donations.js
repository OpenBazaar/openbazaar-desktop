import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutDonations',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({}));
    });

    return this;
  }
}

