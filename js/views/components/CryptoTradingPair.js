/**
 * Will render a a combination of two currenciees indicating that one is being
 * traded for the other (e.g. <btc-icon> BTC > <zec-icon> ZEC), followed by an
 * optional line of text indicating the exchange rate between the two currencies
 * (the view will update if the exchange rate changes). This differs from
 * renderCryptoTradingPair in the crypto util module (which is also the
 * ob.crypto.tradingPair template helper) in that the latter is just a simple display
 * of two currencies being traded for one another. If you do not need to display an
 * exchange rate and your currencies won't change dynamically, the latter might be
 * slightly less boilerplate to implement.
 */

import app from '../../app';
import {
  getExchangeRate,
  events as currencyEvents,
} from '../../utils/currency';
import { ensureMainnetCode } from '../../data/walletCurrencies';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        tradingPairClass: 'cryptoTradingPairLg',
        exchangeRateClass: '',
        fromCur: '',
        fromCurAmount: 1,
        toCur: '',
        localCurrency: app.settings.get('localCurrency'),
        // If passing this in, it should be a string or a function. If it's a function
        // it will be passed the state and coin(s) with missing exchange rates and it
        // should return a string.
        noExchangeRateTip: coinsMissingRates => (
          app.polyglot.t('cryptoTradingPair.tipMissingExchangeRate', {
            coins: coinsMissingRates.join(', '),
          })
        ),
        exchangeRateUnavailable: false,
        iconClass: 'ion-alert-circled clrTAlert',
        truncateCurAfter: 8,
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

    this.listenTo(currencyEvents, 'exchange-rate-change', e => {
      if (
        e.changed.includes(this.getState().toCur) ||
        e.changed.includes(this.getState().fromCur)
      ) {
        const curState = this.getState();
        this.setState({
          ...curState,
          ...this.getConversionState(curState.fromCur, curState.toCur, curState.fromCurAmount),
        });
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
        newState.fromCur = ensureMainnetCode(state.fromCur);

        if (newState.fromCur > state.truncateCurAfter) {
          newState.fromCur = `${newState.fromCur.slice(0, state.truncateCurAfter)}…`;
        }
      }

      if (typeof state.toCur === 'string') {
        newState.toCur = ensureMainnetCode(state.toCur);

        if (newState.toCur > state.truncateCurAfter) {
          newState.toCur = `${newState.toCur.slice(0, state.truncateCurAfter)}…`;
        }
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
    const fromCurRate = getExchangeRate(fromCur);
    const toCurRate = getExchangeRate(toCur);

    return {
      toCurAmount: (toCurRate / fromCurRate) * fromCurAmount,
      fromCurConvertedAmount: (fromCurRate / toCurRate) * fromCurAmount,
      fromRateUnavailable: fromCurRate === undefined,
      toRateUnavailable: toCurRate === undefined,
    };
  }

  render() {
    loadTemplate('components/cryptoTradingPairWrap.html', (t) => {
      const state = this.getState();
      const coinsMissingRates = [];

      if (state.toRateUnavailable) coinsMissingRates.push(state.toCur);
      if (state.fromRateUnavailable) coinsMissingRates.push(state.fromCur);

      let noExchangeRateTip;

      if (coinsMissingRates.length) {
        if (typeof state.noExchangeRateTip === 'function') {
          noExchangeRateTip = state.noExchangeRateTip(coinsMissingRates, state);
        } else if (typeof state.noExchangeRateTip === 'string') {
          noExchangeRateTip = state.noExchangeRateTip;
        }
      }

      this.$el.html(t({
        ...state,
        noExchangeRateTip,
      }));
    });

    return this;
  }
}
