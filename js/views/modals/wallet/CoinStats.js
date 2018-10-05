import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        cryptoCur: '',
        displayCur: app && app.settings && app.settings.get('localCurrency') || 'USD',
        confirmed: undefined,
        unconfirmed: undefined,
        transactionCount: undefined,
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'coinStats border clrP clrBr clrSh3';
  }

  render() {
    loadTemplate('modals/wallet/coinStats.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
