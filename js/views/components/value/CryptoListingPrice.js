// todo: move this a level up - maybe in a crypto folder
// todo: move this a level up - maybe in a crypto folder
// todo: move this a level up - maybe in a crypto folder
// todo: move this a level up - maybe in a crypto folder
// todo: move this a level up - maybe in a crypto folder

import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Value from './Value';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        wrappingClass: 'txRgt tx3 txB',
        wrappingTag: 'div',
        marketRelativityClass: 'tx6 txUnb clamp2',
        // These will be passed onto the nested Value component.
        valueOptions: {},
        ...options.initialState,
      },
    };

    super(opts);
  }

  get tagName() {
    return 'span';
  }

  setState(state = {}, options = {}) {
    if (typeof state.valueOptions !== 'object') {
      throw new Error('state.valueOptions must be provided as an object.');
    }

    if (typeof state.valueOptions.amount !== 'number') {
      throw new Error('state.valueOptions.priceAmount must be provided as ' +
        'a number.');
    }

    if (typeof state.valueOptions.fromCur !== 'string' ||
      !state.valueOptions.fromCur) {
      throw new Error('state.valueOptions.fromCur must be provided as ' +
        'a non-empty string.');
    }

    if (typeof state.valueOptions.toCur !== 'string' ||
      !state.valueOptions.toCur) {
      throw new Error('state.valueOptions.toCur must be provided as ' +
        'a non-empty string.');
    }

    if (typeof state.priceModifier !== 'number') {
      throw new Error('state.priceModifier must be provided as ' +
        'a number');
    }

    return super.setState(state, options);
  }

  render() {
    const state = this.getState();

    loadTemplate('components/cryptoListingPrice.html', (t) => {
      this.$el.html(t({
        ...state,
      }));

      if (this.cryptoPrice) this.cryptoPrice.remove();
      this.cryptoPrice = this.createChild(Value, {
        initialState: { ...state.valueOptions },
      });

      this.getCachedEl('.js-priceContainer')
        .html(this.cryptoPrice.render().el);
    });

    return this;
  }
}
