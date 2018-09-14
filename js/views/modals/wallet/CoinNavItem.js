// import _ from 'underscore';
import app from '../../../app';
import { abbrNum } from '../../../utils';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        active: false,
        balance: 0,
        displayCur: app && app.settings && app.settings.get('localCurrency') || 'PLN',
        ...options.initialState,
      },
    };

    if (!opts.initialState || typeof opts.initialState.code !== 'string' ||
      !opts.initialState.code) {
      throw new Error('Please provide a code as a non-empty string in the initial state');
    }

    if (!opts.initialState || typeof opts.initialState.name !== 'string' ||
      !opts.initialState.name) {
      throw new Error('Please provide a name as a non-empty string in the initial state');
    }

    super(opts);
  }

  className() {
    return 'coinNavItem flexVCent gutterHSm lineHeight1 tx4 clrT2';
  }

  tagName() {
    return 'li';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick() {
    this.trigger('click', { code: this.getState().code });
  }

  render() {
    const state = this.getState();
    this.$el.toggleClass('active', state.active);

    loadTemplate('modals/wallet/coinNavItem.html', (t) => {
      this.$el.html(t({
        ...state,
        abbrNum,
      }));
    });

    return this;
  }
}
