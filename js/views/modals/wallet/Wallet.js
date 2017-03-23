// import $ from 'jquery';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      // initialTabView: 'Configurations',
      ...options,
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return `${super.className()} wallet modalScrollPage`;
  }

  events() {
    return {
      // 'click .js-tab': 'onTabClick',
      ...super.events(),
    };
  }

  // close() {
    // this.selectTab('Configurations');
    // super.close();
  // }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      this.$el.html(t());
      super.render();

      // this.$tabContent = this.$('.js-tabContent');
      // this._$closeClickTargets = null;

      if (this.btcTicker) this.btcTicker.remove();
      this.btcTicker = this.createChild(BTCTicker);
      this.$('.js-btcTickerContainer').append(this.btcTicker.render().$el);
    });

    return this;
  }
}
