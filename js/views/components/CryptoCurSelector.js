import _ from 'underscore';
import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { polyTFallback } from '../../utils/templateHelpers';
import { isSupportedWalletCur } from '../../data/walletCurrencies';
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

    if (options.initialState.disabledCurs &&
      !Array.isArray(options.initialState.disabledCurs)) {
      throw new Error('If disabledCurs are provided, they must be an array.');
    }

    const disabledCurs = options.initialState.disabledCurs ?
      options.initialState.disabledCurs :
      options.initialState.currencies.filter(c => !isSupportedWalletCur(c));

    const opts = {
      ...options,
      initialState: {
        controlType: 'checkbox',
        currencies: [],
        activeCurs: [],
        disabledCurs,
        sort: false,
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
    // Toggle the current active state when clicked.
    const nowActive = !activeCurs.includes(code);

    if (this.getState().controlType === 'radio') {
      activeCurs = [code];
    } else {
      if (nowActive) activeCurs.push(code);
      else activeCurs = activeCurs.filter(c => c !== code);
    }

    this.trigger('currencyClicked', {
      currency: code,
      active: nowActive,
      activeCurs,
    });

    this.setState({
      activeCurs,
    });
  }

  setState(state = {}, options = {}) {
    const curState = this.getState();

    const processedState = {
      ...state,
      // This is a derived field and should not be directly set
      processedCurs: Array.isArray(curState.processedCurs) ?
        curState.processedCurs : [],
    };

    // De-dupe any passed in currencies.
    if (state.currencies && Array.isArray(state.currencies)) {
      processedState.currencies = [...new Set(state.currencies)];
    }

    // De-dupe any passed in active currencies
    if (state.activeCurs && Array.isArray(state.activeCurs)) {
      let activeCurs = [...new Set(state.activeCurs)];

      // Remove any disabled currencies from the active list.
      if (state.disabledCurs && state.disabledCurs.length) {
        activeCurs = activeCurs.filter(c => !state.disabledCurs.includes(c));
      }

      // Radio controls can only have one active currency.
      if (state.controlType === 'radio') activeCurs = [state.activeCurs[0]];

      processedState.activeCurs = activeCurs;
    }

    // If new currencies have been passed in, replace the old ones.
    if (processedState.currencies && processedState.currencies.length &&
      !_.isEqual(curState.currencies, processedState.currencies)) {
      processedState.processedCurs = processedState.currencies
        .map(cur => {
          const displayName = polyTFallback(`cryptoCurrencies.${cur}`, cur);

          return {
            code: cur,
            displayName,
            disabled: processedState.disabledCurs.includes(cur),
            active: processedState.activeCurs.includes(cur),
          };
        });

      const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
      if (processedState.sort) {
        processedState.processedCurs.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, locale,
            { sensitivity: 'base' }));
      }
    } else {
      // Handle changes to the active state if the currencies didn't change.
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
