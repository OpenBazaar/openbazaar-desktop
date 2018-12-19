import loadTemplate from '../../../utils/loadTemplate';
import { recordEvent } from '../../../utils/metrics';

import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        sendModeOn: true,
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'sendReceiveNav clrP';
  }

  events() {
    return {
      'click .js-btnSend': 'onClickSend',
      'click .js-btnReceive': 'onClickReceive',
    };
  }

  onClickSend() {
    this.trigger('click-send');
    recordEvent('Wallet_SendShow');
  }

  onClickReceive() {
    this.trigger('click-receive');
    recordEvent('Wallet_ReceiveShow');
  }

  render() {
    loadTemplate('modals/wallet/sendReceiveNav.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
