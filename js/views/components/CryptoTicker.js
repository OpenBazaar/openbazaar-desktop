import app from '../../app';
import {
  convertAndFormatCurrency,
  events as currencyEvents,
} from '../../utils/currency';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        displayCur: app.settings.get('localCurrency') || 'USD',
        ...options.initialState,
      },
    };

    super(opts);
    this.listenTo(app.settings, 'change:localCurrency',
      (md, cur) => this.setState({ displayCur: cur }));
    this.listenTo(currencyEvents, 'exchange-rate-change', e => {
      if (e.changed.includes(this.getState().displayCur) ||
        e.changed.includes(this.getState().coinType)) {
        this.setState({ displayRate: this.calcDisplayRate() });
      }
    });
  }

  className() {
    return 'cryptoTicker';
  }

  setState(state, options) {
    const curState = this.getState();

    const mergedState = {
      ...curState,
      ...state,
    };

    if (typeof mergedState.coinType !== 'string' || !mergedState.coinType) {
      throw new Error('The state must include a coinType.');
    }

    if (mergedState.coinType === mergedState.displayCur) {
      mergedState.displayRate = null;
    } else if (curState.coinType !== mergedState.coinType ||
      curState.displayCur !== mergedState.displayCur) {
      mergedState.displayRate =
        this.calcDisplayRate(mergedState.coinType, mergedState.displayCur);
    }

    return super.setState(mergedState, options);
  }

  calcDisplayRate(
    coinType = this.getState().coinType,
    displayCur = this.getState().displayCur
  ) {
    let rate = null;

    try {
      rate = convertAndFormatCurrency(1, coinType, displayCur, { skipConvertOnError: false });
    } catch (e) {
      // pass
    }

    return rate;
  }

  render() {
    loadTemplate('components/cryptoTicker.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}

