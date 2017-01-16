import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { getExchangeRate } from '../../../utils/currency';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutBTCTicker pureFlex',
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

  render() {
    if (this.currentBTCPrice == null) {
      this.currentBTCPrice = this.getCurrentPrice(); 
    }

    loadTemplate('modals/about/btcticker.html', (t) => {
      this.$el.html(t({
        currentBTCPrice: this.currentBTCPrice.toFixed(2),
      }));
    });

    console.info('render');
    return this;
  }
}

