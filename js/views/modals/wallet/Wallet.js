import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import BTCTicker from '../../BTCTicker';
import Stats from './Stats';
import SendMoney from './SendMoney';
import ReceiveMoney from './ReceiveMoney';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      sendModeOn: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    this.sendModeOn = opts.sendModeOn;

    this.listenTo(app.walletBalance, 'change:confirmed', (md, confirmedAmount) => {
      if (this.stats) {
        this.stats.setState({
          balance: confirmedAmount,
        });
      }
    });

    this.listenTo(app.settings, 'change:localCurrency', (md, curr) => {
      if (this.stats) {
        this.stats.setState({
          userCurrency: curr,
        });
      }
    });
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

  render() {
    loadTemplate('modals/wallet/wallet.html', t => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          walletIconTmpl,
        }));

        super.render();

        if (this.btcTicker) this.btcTicker.remove();
        this.btcTicker = this.createChild(BTCTicker);
        this.$('.js-btcTickerContainer').append(this.btcTicker.render().$el);

        // render the wallet stats
        if (this.stats) this.stats.remove();

        this.stats = this.createChild(Stats, {
          initialState: {
            balance: app.walletBalance.get('confirmed'),
            userCurrency: app.settings.get('localCurrency'),
          },
        });

        this.$('.js-walletStatsContainer').html(this.stats.render().el);

        // render the send money view
        if (this.sendMoney) this.sendMoney.remove();
        this.sendMoney = this.createChild(SendMoney);
        this.$('.js-sendReceiveContainer').html(this.sendMoney.render().el);

        // render the receive money view
        if (this.receiveMoney) this.receiveMoney.remove();
        this.receiveMoney = this.createChild(ReceiveMoney);
        this.$('.js-sendReceiveContainer').append(this.receiveMoney.render().el);
      });
    });

    return this;
  }
}
