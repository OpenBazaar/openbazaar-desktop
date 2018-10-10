import _ from 'underscore';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { polyTFallback } from '../../utils/templateHelpers';
import { ensureMainnetCode, isSupportedWalletCur } from '../../data/walletCurrencies';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    // de-dupe any passed in currencies or active currencies
    const currencies = new Set(options.initialState.currencies || []);
    const activeCurs = new Set(options.initialState.activeCurs || []);
    const opts = {
      controlType: 'checkbox',
      ...options,
      initialState: {
        ...options.initialState,
        currencies: [...currencies],
        activeCurs: [...activeCurs],
      },
    };

    const controlTypes = ['checkbox', 'radio'];

    if (!controlTypes.includes(opts.controlType)) {
      throw new Error('The controlType must be a valid value.');
    }

    if (!Array.isArray(opts.initialState.activeCurs)) {
      throw new Error('If activeCurs are provided, they just be an array.');
    }

    super(opts);
    this.controlType = opts.controlType;
  }

  get className() {
    return 'unstyled borderStackedAll curSelector';
  }

  get tagName() {
    return 'ul';
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();
    const processedState = {
      ...state,
      // This is a derived field and should not be directly set
      processedCurs: Array.isArray(curState.processedCurs) ?
        curState.processedCurs : [],
    };

    if (Array.isArray(processedState.currencies) &&
      (
        curState.sort !== processedState.sort ||
        !_.isEqual(curState.currencies, state.currencies)
      )) {
      processedState.processedCurs = processedState.currencies
        .map(cur => {
          const code = ensureMainnetCode(cur);
          const displayName = polyTFallback(`cryptoCurrencies.${code}`, cur);

          return {
            code,
            displayName,
            walletSupported: isSupportedWalletCur(code),
            active: state.activeCurs.includes(code),
          };
        });

      const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
      if (processedState.sort) {
        processedState.sort((a, b) =>
          a.localCompare(b, locale, { sensitivity: 'base' }));
      }
    }

    super.setState(processedState, options);
  }

  render() {
    loadTemplate('components/currencySelector.html', (t) => {
      this.$el.html(t({
        controlType: this.controlType,
        ...this.getState(),
      }));
    });

    return this;
  }
}
