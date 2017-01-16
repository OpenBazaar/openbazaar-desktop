import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { getExchangeRate } from '../../../utils/currency';


const RATE_EXPIRY_S = '300';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutBTCTicker pureFlex alwaysFirst',
      ...options,
    });
  }

  getCurrentPrice() {
    return getExchangeRate('USD');
  }

  updatePrice() {
    const latestPrice = this.getCurrentPrice();
    if (latestPrice !== this.currentBTCPrice) {
      this.currentBTCPrice = latestPrice;
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

    if (this.currentBTCPrice == null) {
      this.currentBTCPrice = this.getCurrentPrice();
    }

    loadTemplate('modals/about/btcticker.html', (t) => {
      this.$el.html(t({
        currentBTCPrice: this.currentBTCPrice.toFixed(2),
      }));
    });

    return this;
  }
}

