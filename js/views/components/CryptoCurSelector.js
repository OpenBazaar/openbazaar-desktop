import _ from 'underscore';
import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { polyTFallback } from '../../utils/templateHelpers';
import { ensureMainnetCode, isSupportedWalletCur } from '../../data/walletCurrencies';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const controlTypes = ['checkbox', 'radio'];

    const controlType = options.initialState.controlType;
    if (controlType && !controlTypes.includes(controlType)) {
      throw new Error('If provided the controlType must be a valid value.');
    }

    if (!options.initialState.currencies ||
      !Array.isArray(options.initialState.currencies)) {
      throw new Error('Please provide an initial array of currencies.');
    }

    if (options.initialState.activeCurs &&
      !Array.isArray(options.initialState.activeCurs)) {
      throw new Error('If activeCurs are provided, they must be an array.');
    }

    const opts = {
      ...options,
      initialState: {
        controlType: 'checkbox',
        currencies: [],
        activeCurs: [],
        ...options.initialState,
      },
    };

    super(opts);
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
    const code = $(e.target).attr('data-code');
    let activeCurs = [...this.getState().activeCurs];
    const active = !activeCurs.includes(code);

    if (this.getState().controlType === 'radio') {
      activeCurs = [code];
    } else {
      if (active) activeCurs.push(code);
      else activeCurs = activeCurs.filter(c => c !== code);
    }

    this.trigger('currencyClicked', {
      currency: code,
      active,
      activeCurs,
    });

    this.setState({
      activeCurs,
    });
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();
    // De-dupe any passed in currencies.
    if (state.currencies) state.currencies = [...new Set(state.currencies)];

    if (state.activeCurs) {
      // Radio controls can only have one active currency.
      if (state.controlType === 'radio') {
        state.activeCurs = [state.activeCurs[0]];
      } else {
        state.activeCurs = [...new Set(state.activeCurs)];
      }
    }

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
            { sensitivity: 'base' }));
      }
    }

    if (!_.isEqual(curState.activeCurs, processedState.activeCurs)) {
      processedState.processedCurs.map(cur => {
        cur.active = processedState.activeCurs.includes(cur.code);
        return cur;
      });
    }

    super.setState(processedState, options);
  }

  render() {
    loadTemplate('components/cryptoCurSelector.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
