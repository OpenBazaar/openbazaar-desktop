// import _ from 'underscore';
// import app from '../../../app';
// import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import CoinNavItem from './CoinNavItem';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        coins: [],
        ...options.initialState,
      },
    };

    super(opts);
    this.navItems = [];
  }

  className() {
    return 'unstyled coinNav';
  }

  tagName() {
    return 'ul';
  }

  get active() {
    return this.getState().active;
  }

  render() {
    const state = this.getState();

    this.navItems.forEach(vw => vw.remove());
    this.navItems = [];
    const coinContainer = document.createDocumentFragment();

    state.coins.forEach(coin => {
      const vw = this.createChild(CoinNavItem, {
        initialState: {
          active: state.active === coin.code,
        },
      });

      this.listenTo(vw, 'click', e => {
        this.setState({ active: e.code });
      });

      coinContainer.appendChild(vw.render().el);
    });

    this.el.html(coinContainer);

    return this;
  }
}
