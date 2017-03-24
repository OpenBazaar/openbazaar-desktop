// import $ from 'jquery';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';
import Stats from './Stats';
import SendMoney from './SendMoney';

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

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
        }));

        super.render();

        // this.$tabContent = this.$('.js-tabContent');
        // this._$closeClickTargets = null;

        if (this.btcTicker) this.btcTicker.remove();
        this.btcTicker = this.createChild(BTCTicker);
        this.$('.js-btcTickerContainer').append(this.btcTicker.render().$el);

        // render the wallet stats
        if (this.stats) this.stats.remove();

        this.stats = this.createChild(Stats, {
          initialState: {
            isFetching: true,
          },
        });

        this.$('.js-walletStatsContainer').html(this.stats.render().el);

        // js-sendReceiveContainer
        // render the send money view
        if (this.sendMoney) this.sendMoney.remove();

        this.sendMoney = this.createChild(SendMoney, {
          // model: moo,
        });

        this.$('.js-sendReceiveContainer').html(this.sendMoney.render().el);
      });
    });

    return this;
  }
}
