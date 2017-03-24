// import $ from 'jquery';
// import _ from 'underscore';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
  }

  className() {
    return 'sendMoney';
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
    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        errors: {},
      }));

      // this._$deleteConfirm = null;
    });

    return this;
  }
}
