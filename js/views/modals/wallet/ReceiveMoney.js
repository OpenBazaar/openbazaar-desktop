// import $ from 'jquery';
// import _ from 'underscore';
// import app from '../../../app';
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

  events() {
    return {
      // 'click .js-btnConnect': 'onConnectClick',
    };
  }

  // remove() {
  //   super.remove();
  // }

  render() {
    loadTemplate('modals/wallet/receiveMoney.html', (t) => {
      this.$el.html(t({
        qrDataUri: qr('bitcoin:mrCtpywttZSQCpW5eyYuEZfhpmVFPL8kYg',
          { type: 6, size: 5, level: 'Q' }),
        errors: {},
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
