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
      throw new Error('If activeCurs are provided, they must be an array.');
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

  events() {
    return {
      'click .js-curControl': 'handleCurClick',
    };
  }

  handleCurClick(e) {
    const targ = $(e.target);
    const code = targ.attr('data-code');
    if (!targ.prop('checked')) {
      this.setState({
        activeCurs: this.getState().activeCurs.filter(c => c !== code),
      })
    } else {
      const aCurs = new Set(this.getState().activeCurs);
      aCurs.add(code);

      this.setState({
        activeCurs: [...aCurs],
      })
    }
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
            active: processedState.activeCurs.includes(code),
          };
        });

      const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
      if (processedState.processedCurs.sort) {
        processedState.processedCurs.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, locale,
            {sensitivity: 'base'}));
      }
    }

    if (!_.isEqual(curState.activeCurs, processedState.activeCurs)){
      processedState.processedCurs.map(cur => {
        cur.active = processedState.activeCurs.includes(cur.code);
        return cur;
      })
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
