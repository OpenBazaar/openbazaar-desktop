// import $ from 'jquery';
import app from '../../../app';
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
    return `${super.className()} wallet modalScrollPage modalMedium`;
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

  // Normally, we'd user the currency module to format currency, but
  // this is a unique case where we want to format a BTC price without
  // the BTC symbol, so we'll create a custom function. If we find other
  // areas in the app need this, we can integrate it into the currency module.
  formatUnitlessBtc(amount) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide a number.');
    }

    return new Intl.NumberFormat(app.settings.get('language'), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(amount);
  }

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
          formatUnitlessBtc: this.formatUnitlessBtc,
        }));

        super.render();

        // this.$tabContent = this.$('.js-tabContent');
        // this._$closeClickTargets = null;

        if (this.btcTicker) this.btcTicker.remove();
        this.btcTicker = this.createChild(BTCTicker);
        this.$('.js-btcTickerContainer').append(this.btcTicker.render().$el);
      });
    });

    return this;
  }
}
