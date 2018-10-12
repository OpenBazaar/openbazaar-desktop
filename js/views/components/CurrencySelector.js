import _ from 'underscore';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { polyTFallback } from '../../utils/templateHelpers';
import { ensureMainnetCode, isSupportedWalletCur } from '../../data/walletCurrencies';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const controlTypes = ['checkbox', 'radio'];

    if (options.controlType && !controlTypes.includes(options.controlType)) {
      throw new Error('If provided the controlType must be a valid value.');
    }

    if (!options.initialState.currencies ||
      !Array.isArray(options.initialState.currencies)) {
      throw new Error('Please provide an initial array of currencies.')
    }

    if (options.initialState.activeCurs &&
      !Array.isArray(options.initialState.activeCurs)) {
      throw new Error('If activeCurs are provided, they must be an array.');
    }

    const opts = {
      controlType: 'checkbox',
      ...options,
      initialState: {
        ...options.initialState,
      },
    };

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
      'click .js-curRow': 'handleCurClick',
    };
  }

  handleCurClick(e) {
    const targ = $(e.target).closest('.js-curRow');
    const code = targ.attr('data-code');
    const active = targ.prop('checked');

    this.trigger('currencyClicked', { currency: code, active });

    if (active){
      this.setState({
        activeCurs: this.getState().activeCurs.push(code),
      });
    } else {
      this.setState({
        activeCurs: this.getState().activeCurs.filter(c => c !== code),
      });
    }
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();
    // de-dupe any passed in currencies
    if (state.currencies) state.currencies = [...new Set(state.currencies)];
    if (state.activeCurs) state.activeCurs = [...new Set(state.activeCurs)];

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
