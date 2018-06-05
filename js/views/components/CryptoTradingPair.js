import app from '../../app';
import { getServerCurrency } from '../../data/cryptoCurrencies';
import {
  getExchangeRate,
  events as currencyEvents,
} from '../../utils/currency';
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
        fromCurAmount: 1,
        toCur: '',
        localCurrency: app.settings.get('localCurrency'),
        // If passing this in, it should be a string or a function. If it's a function
        // it will be passed the coinType and should return a string.
        noExchangeRateTip: coinType =>
          app.polyglot.t('cryptoTradingPair.tipMissingExchangeRate',
              { coinType }),
        exchangeRateUnavailable: false,
        iconClass: 'ion-alert-circled clrTAlert',
        ...options.initialState || {},
      },
    };

    super(opts);

    console.log('silly');
    window.silly = this;

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
    
    this.listenTo(currencyEvents, 'exchange-rate-change', e => {
      if (
        e.changed.includes(this.getState().toCur) ||
        e.changed.includes(this.getState().fromCur)
      ) {
        const curState = this.getState();
        this.setState({
          ...curState,
          ...this.getConversionState(curState.fromCur, curState.toCur, curState.fromCurAmount),
        })
      }
    });
  }

  className() {
    return 'cryptoTradingPairWrap';
  }

  setState(state = {}, options = {}) {
    const prevState = this.getState();
    let newState = {
      ...prevState,
      ...state,
    };

    if (typeof state === 'object') {
      if (typeof state.fromCur === 'string') {
        newState.fromCur = state.fromCur.toUpperCase();
      }

      if (typeof state.toCur === 'string') {
        newState.toCur = state.toCur.toUpperCase();
      }

      if (newState.fromCur !== prevState.fromCur ||
        newState.toCur !== prevState.toCur ||
        newState.fromCurAmount !== prevState.fromCurAmount) {
        newState = {
          ...newState,
          ...this.getConversionState(newState.fromCur, newState.toCur, newState.fromCurAmount),
        };
      }
    }

    return super.setState(newState, options);
  }

  getConversionState(fromCur, toCur, fromCurAmount) {
    const exchangeRate = getExchangeRate(toCur); 
    const toCurAmount = fromCurAmount * getExchangeRate(toCur);

    return {
      toCurAmount,
      fromCurConvertedAmount: fromCurAmount / toCurAmount,
      exchangeRateUnavailable: exchangeRate === undefined,
    }
  }

  render() {
    loadTemplate('components/cryptoTradingPairWrap.html', (t) => {
      const state = this.getState();
      let noExchangeRateTip;

      if (typeof state.noExchangeRateTip === 'function') {
        noExchangeRateTip = state.noExchangeRateTip(state.toCur);
      } else if (typeof state.noExchangeRateTip === 'string') {
        noExchangeRateTip = state.noExchangeRateTip;
      }

      this.$el.html(t({
        ...state,
        noExchangeRateTip,
      }));
    });

    return this;
  }
}
