// While this file is named BTCTicker, it is really a widget which will show the exchange
// rate of the server's currency (may be BTC or another crypto) in the user's local currency.
import loadTemplate from '../utils/loadTemplate';
import baseVw from './baseVw';
import { getExchangeRate } from '../utils/currency';
import { getServerCurrency } from '../data/cryptoCurrencies';
import app from '../app';

const RATE_EXPIRY_S = '300';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.listenTo(app.settings, 'change:localCurrency', this.updatePrice);
  }

  className() {
    return 'btcTicker';
  }

  get localCurrency() {
    return app.settings.get('localCurrency');
  }

  getCurrentPrice() {
    return getExchangeRate(this.localCurrency);
  }

  updatePrice() {
    const latestPrice = this.getCurrentPrice();
    if (latestPrice !== this.currentPrice) {
      this.currentPrice = latestPrice;
      this.render();
    }
  }

  remove() {
    clearInterval(this.refreshCode);
    super.remove();
  }

  render() {
    if (this.refreshCode == null) {
      this.refreshCode = setInterval(() => this.updatePrice(), RATE_EXPIRY_S * 1000);
    }

    if (this.currentPrice == null) {
      this.currentPrice = this.getCurrentPrice();
    }

    const serverCur = getServerCurrency();
    // We won't show the ticker if their local currency is set to the server currency or if
    // exchange rate data is not available.
    const showTicker = (this.localCurrency !== serverCur.code &&
      this.localCurrency !== serverCur.testnetCode) && this.currentPrice !== undefined;

    if (showTicker) {
      loadTemplate('btcTicker.html', (t) => {
        this.$el.html(t({
          currentPrice: this.currentPrice,
          localCurrency: this.localCurrency,
        }));
      });
    } else {
      this.$el.empty();
    }

    return this;
  }
}

