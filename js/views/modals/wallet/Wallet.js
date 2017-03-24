// import $ from 'jquery';
// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';
import Stats from './Stats';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      // initialTabView: 'Configurations',
      sendModeOn: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.sendModeOn = opts.sendModeOn;
  }

  className() {
    return `${super.className()} wallet modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-toggleSendReceive': 'onClickToggleSendReceive',
      ...super.events(),
    };
  }

  onClickToggleSendReceive() {
    this.sendModeOn = !this.sendModeOn;
  }

  set sendModeOn(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a boolean.');
    }

    if (bool !== this._sendModeOn) {
      this.$el.toggleClass('receiveModeOn', !bool);
      this._sendModeOn = bool;
    }
  }

  get sendModeOn() {
    return this._sendModeOn;
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

        // render the send money view
        if (this.sendMoney) this.sendMoney.remove();

        this.sendMoney = this.createChild(SendMoney, {
          // model: moo,
        });

        this.$('.js-sendReceiveContainer').html(this.sendMoney.render().el);

        // render the receive money view
        if (this.receiveMoney) this.receiveMoney.remove();

        this.receiveMoney = this.createChild(ReceiveMoney, {
          // model: moo,
        });

        this.$('.js-sendReceiveContainer').append(this.receiveMoney.render().el);
      });
    });

    return this;
  }
}
