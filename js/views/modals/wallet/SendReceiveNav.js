import loadTemplate from '../../../utils/loadTemplate';
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
  }

  onClickReceive() {
    this.trigger('click-receive');
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
