import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      fetchingFee: false,
      fee: false,
      displayCurrency: app.settings.get('localCurrency') || 'BTC',
      paymentAmount: 0,
      paymentCurrency: 'BTC',
      ...options.initialState || {},
    };
  }

  events() {
    return {
      'click .js-btnConfirmSend': 'onClickSend',
      'click .js-sendConfirmCancel': 'onClickCancel',
    };
  }

  onClickSend() {
    this.trigger('clickSend');
  }

  onClickCancel() {
    this.trigger('clickCancel');
  }

  render() {
    loadTemplate('modals/wallet/sendConfirmBox.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
