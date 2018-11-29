import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import { isSupportedWalletCur } from '../../data/walletCurrencies';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    let disabledCurs = [];

    if (
      Array.isArray(options.initialState.disabledCurs) &&
      Array.isArray(options.initialState.currencies)
    ) {
      disabledCurs =
        options.initialState.currencies.filter(c => !isSupportedWalletCur(c));
    }

    const opts = {
      disabledMsg: '',
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
    this.options = opts;
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

    this.setState({ activeCurs });
  }


  setState(state = {}, options = {}) {
    const controlTypes = ['checkbox', 'radio'];
    const curState = this.getState();

    if (state.hasOwnProperty('controlType') &&
      !controlTypes.includes(state.controlType)) {
      throw new Error('If provided the controlType must be a valid value.');
    }

    const checkCurArray = (fieldName => {
      if (state.hasOwnProperty(fieldName) &&
        !Array.isArray(state[fieldName])) {
        throw new Error(`If provided the ${fieldName} must be an array.`);
      }
    });

    ['currencies', 'activeCurs', 'disabledCurs']
      .forEach(field => checkCurArray(field));

    // This is a derived field and should not be directly set
    delete state.processedCurs;

    const processedState = {
      ...curState,
      ...state,
      currencies: Array.isArray(state.currencies) ?
        [...new Set(state.currencies)] : curState.currencies,
    };

    // Radio controls must have no more than one active currency.
    if (processedState.controlType === 'radio') {
      processedState.activeCurs = processedState.activeCurs && processedState.activeCurs.length ?
        [processedState.activeCurs[0]] : [];
    }

    // Remove any disabled currencies from the active list.
    if (state.activeCurs || state.disabledCurs) {
      processedState.activeCurs = [...new Set(processedState.activeCurs
        .filter(c => !processedState.disabledCurs.includes(c)))];
    }

    // If necessary, create the processed curs
    if (
      !processedState.processedCurs ||
      state.currencies ||
      !!processedState.sort !== !!state.sort
    ) {
      processedState.processedCurs = processedState.currencies
        .map(cur => ({
          code: cur,
          displayName: app.polyglot.t(`cryptoCurrencies.${cur}`, {
            _: cur,
          }),
          disabled: processedState.disabledCurs.includes(cur),
          active: processedState.activeCurs.includes(cur),
        }));

      if (processedState.sort) {
        const locale = app.localSettings.standardizedTranslatedLang() || 'en-US';
        processedState.processedCurs.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, locale,
            { sensitivity: 'base' }));
      }
    } else if (state.activeCurs || state.disabledCurs) {
      // If active or disabled lists are passed in, we'll assume they're
      // different and ensure the processedCurrencies list reflects them.
      processedState.processedCurs = processedState.processedCurs.map(cur => ({
        ...cur,
        active: processedState.activeCurs.includes(cur.code),
        disabled: processedState.disabledCurs.includes(cur.code),
      }));
    }

    super.setState(processedState, options);
  }

  render() {
    loadTemplate('components/cryptoCurSelector.html', (t) => {
      this.$el.html(t({
        cid: this.cid,
        ...this.options,
        ...this.getState(),
      }));
    });

    return this;
  }
}
