import app from '../../../app';
import { NoExchangeRateDataError } from '../../../utils/currency';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        active: false,
        displayCur: app && app.settings && app.settings.get('localCurrency') || 'USD',
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
    const state = this.getState();

    if (!state.active && state.clientSupported) {
      this.trigger('selected', { code: this.getState().code });
    }
  }

  render() {
    const state = this.getState();

    let addClasses = state.active ? 'active' : '';
    addClasses = !state.clientSupported ? 'clientUnsupported' : '';

    let removeClasses = !state.active ? 'active' : '';
    removeClasses = state.clientSupported ? 'clientUnsupported' : '';

    this.$el.addClass(addClasses);
    this.$el.removeClass(removeClasses);

    loadTemplate('modals/wallet/coinNavItem.html', (t) => {
      this.$el.html(t({
        ...state,
        NoExchangeRateDataError,
      }));
    });

    return this;
  }
}
