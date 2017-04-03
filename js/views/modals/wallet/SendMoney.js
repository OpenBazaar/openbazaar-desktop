import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'sendMoney';
  }

  render() {
    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        errors: {},
      }));
    });

    return this;
  }
}
