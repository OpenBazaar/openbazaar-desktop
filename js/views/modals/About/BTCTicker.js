import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutBTCTicker',
      ...options,
    });
  }

  getCurrentPrice() {
    // for realz
    return 2000 + Math.random()*100 - 50;
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
        currentBTCPrice: this.currentBTCPrice,
      }));
    });

    console.info('render');
    return this;
  }
}

