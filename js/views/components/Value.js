import { clipboard } from 'electron';
import { toStandardNotation } from '../../utils/number';
import {
  convertAndFormatCurrency,
  convertCurrency,
} from '../../utils/currency';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        // These are documented in utils/currency/index.js in
        amount: undefined,
        fromCur: 'USD',
        toCur: 'USD',
        locale: app && app.localSettings &&
          app.localSettings.standardizedTranslatedLang() || 'en-US',
        btcUnit: app && app.localSettings &&
          app.localSettings.get('bitcoinUnit') || 'BTC',
        useCryptoSymbol: true,
        minDisplayDecimals: 2,
        maxDisplayDecimals: 2,
        maxDisplayDecimalsOnZero: 6,
        formatConfig: false,
        // END - These are documented in utils/currency/index.js in

        // Will truncate and offer a tooltip if the formattedValue is
        // greater than this number of characters. Pass in false if you
        // don't want any truncation to occur.
        truncateAfterChars: 25,
        // If true, will offer the full price in a tooltip if the formatted
        // price displays as a zero. This would happen if the amount is smaller
        // than the minimum number thee given maxDecimals could account for.
        tooltipOnTruncatedZero: true,
        tipWrapBaseClass: 'arrowBoxTipWrap',
        tipWrapClass: 'unconstrainedWidth',
        tipBaseClass: 'js-formatCurTip formatCurTip',
        tipClass: 'arrowBoxTipCenteredBot clrP clrBr clrT',
        ...options.initialState,
      },
    };

    super(opts);
  }

  get tagName() {
    return 'span';
  }

  events() {
    return {
      'click .js-copyTipAmount': 'onClickCopyTip',
    };
  }

  onClickCopyTip() {
    const state = this.getState();
    let amount = state.amount;

    try {
      amount = convertCurrency(amount, state.fromCur, state.toCur);
    } catch (e) {
      // pass
    }

    clipboard.writeText(
      toStandardNotation(amount, { maxDisplayDecimals: 20 })
    );

    this.getCachedEl('.js-copiedIndicator')
      .show();
    this.getCachedEl('.js-copyTipAmount')
      .hide();

    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => {
      this.getCachedEl('.js-copiedIndicator')
        .hide();
      this.getCachedEl('.js-copyTipAmount')
        .show();
    }, 2000);
  }

  /*
   * Will pluck the format options out of the state.
   */
  getFormatOptions() {
    const state = this.getState();

    return {
      amount: state.amount,
      fromCur: state.fromCur,
      toCur: state.toCur,
      locale: state.locale,
      btcUnit: state.btcUnit,
      useCryptoSymbol: state.useCryptoSymbol,
      minDisplayDecimals: state.minDisplayDecimals,
      maxDisplayDecimals: state.maxDisplayDecimals,
      maxDisplayDecimalsOnZero: state.maxDisplayDecimalsOnZero,
    };
  }

  /*
   * Returns true if the amount would display as zero given the
   * provided max decimals.
   */
  isResultZero(amount, maxDecimals) {
    return amount < parseFloat(`.${'0'.repeat(maxDecimals - 1)}1`);
  }

  remove() {
    clearTimeout(this.copiedTimeout);
    super.remove();
  }

  render() {
    const state = this.getState();
    let formattedAmount = convertAndFormatCurrency(
      state.amount,
      state.fromCur,
      state.toCur,
      {
        formatOptions: this.getFormatOptions(),
      }
    );

    let tipAmount;
    const isResultZero =
      this.isResultZero(state.amount, state.maxDisplayDecimals);

    if (
      isResultZero ||
      (
        typeof state.truncateAfterChars === 'number' &&
        formattedAmount.length > state.truncateAfterChars
      )
    ) {
      if (isResultZero) {
        formattedAmount = convertAndFormatCurrency(
          state.amount,
          state.fromCur,
          state.toCur,
          {
            formatOptions: {
              ...this.getFormatOptions(),
              minDisplayDecimals: 2,
            },
          }
        );
      }

      tipAmount = convertAndFormatCurrency(
        state.amount,
        state.fromCur,
        state.toCur,
        {
          formatOptions: {
            ...this.getFormatOptions(),
            minDisplayDecimals: 2,
            maxDisplayDecimals: 20,
            maxDisplayDecimalsOnZero: 20,
          },
        }
      );

      formattedAmount = app.polyglot.t('value.truncatedValue.message', {
        value: `${formattedAmount.slice(0, state.truncateAfterChars + 1)}`,
        ellipse: '…',
      });
    }

    loadTemplate('components/value.html', (t) => {
      this.$el.html(t({
        ...state,
        formattedAmount,
        tipAmount,
      }));
    });

    return this;
  }
}
