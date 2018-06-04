import app from '../../app';
import { getServerCurrency } from '../../data/cryptoCurrencies';
import { getExchangeRate } from '../../utils/currency';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const serverCur = getServerCurrency();
    const opts = {
      ...options,
      initialState: {
        tradingPairClass: 'cryptoTradingPairLg',
        exchangeRateClass: '',
        fromCur: serverCur && serverCur.code || '',
        toCur: '',
        localCurrency: app.settings.get('localCurrency'),
        ...options.initialState || {},
      },
    };

    super(opts);

    // Since the initial state is not being piped through setState in the
    // base class, this is a hack to run it through setState now and ensure
    // setState updates the exchange rate which is based on the toCur changing.
    if (typeof this._state.toCur === 'string' && this._state.toCur) {
      const toCur = this._state.toCur;
      this._state.toCur = '';
      this.setState({
        ...this._state,
        toCur,
      });
    }
  }

  className() {
    return 'cryptoTradingPairWrap';
  }

  setState(state = {}, options = {}) {
    const prevState = this.getState();
    let newState = { ...state };

    if (typeof state === 'object') {
      if (typeof state.fromCur === 'string') {
        newState.fromCur = state.fromCur.toUpperCase();
      }

      if (typeof state.toCur === 'string') {
        newState.toCur = state.toCur.toUpperCase();
      }

      if (newState.fromCur !== prevState.fromCur ||
        newState.toCur !== prevState.fromCur) {
        newState = {
          ...newState,
          ...this.getConversionAmounts(newState.fromCur, newState.toCur),
        };
      }
    }

    return super.setState(newState, options);
  }

  getConversionAmounts(fromCur, toCur) {
    const toCurAmount = getExchangeRate(toCur);
    
    return {
      toCurAmount,
      fromCurAmount: 1 / toCurAmount,
    }
  }

  render() {
    loadTemplate('components/cryptoTradingPairWrap.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
