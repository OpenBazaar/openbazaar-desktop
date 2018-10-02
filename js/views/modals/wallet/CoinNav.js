import app from '../../../app';
import baseVw from '../../baseVw';
import CoinNavItem from './CoinNavItem';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        coins: [],
        displayCur: app && app.settings && app.settings.get('localCurrency') || 'USD',
        ...options.initialState,
      },
    };

    super(opts);
    this.navItems = [];
  }

  className() {
    return 'coinNav unstyled border padMdKids borderStacked clrP clrBr clrSh3';
  }

  tagName() {
    return 'ul';
  }

  render() {
    const state = this.getState();

    this.navItems.forEach(vw => vw.remove());
    this.navItems = [];
    const coinContainer = document.createDocumentFragment();

    state.coins.forEach(coin => {
      const vw = this.createChild(CoinNavItem, {
        initialState: {
          ...coin,
          active: state.active === coin.code,
          displayCur: state.displayCur,
        },
      });

      this.listenTo(vw, 'selected', e => {
        this.setState({ active: e.code });
        this.trigger('coinSelected', { code: e.code });
      });

      coinContainer.appendChild(vw.render().el);
    });

    this.$el.html(coinContainer);

    return this;
  }
}
