import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        tradingPairClassName: '',
        ...options.initialState || {},
      },
    };

    super(opts);
  }

  className() {
    return 'cryptoTradingPairWrap';
  }

  setState(state, options = {}) {
    if (state) {
      const newState = { ...state };

      if (typeof state.fromCur === 'string') {
        newState.fromCur = state.fromCur.toUpperCase();
      }

      if (typeof state.toCur === 'string') {
        newState.toCur = state.toCur.toUpperCase();
      }      
    }

    return super.setState(newState, options);
  }

  render() {
    loadTemplate('modals/CryptoTradingPair.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
