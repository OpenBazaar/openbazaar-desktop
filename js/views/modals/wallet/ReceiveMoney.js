import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import qr from 'qr-encode';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'receiveMoney';
  }

  render() {
    loadTemplate('modals/wallet/receiveMoney.html', (t) => {
      this.$el.html(t({
        qrDataUri: qr('bitcoin:mrCtpywttZSQCpW5eyYuEZfhpmVFPL8kYg',
          { type: 6, size: 5, level: 'Q' }),
        errors: {},
      }));
    });

    return this;
  }
}
