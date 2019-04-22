import { clipboard } from 'electron';
import { toStandardNotation } from '../../../utils/number';
import {
  convertAndFormatCurrency,
  convertCurrency,
  isFormattedResultZero,
} from '../../../utils/currency';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export function setCurs(options = {}) {
  if (typeof options !== 'object') {
    throw new Error('Please provide the options as an object.');
  }

  ['fromCur', 'toCur']
    .forEach(field => {
      if (
        options[field] !== undefined &&
        (
          typeof options[field] !== 'string' ||
          !options[field]
        )
      ) {
        throw new Error(`If provided, the ${field} must be a non-empty string.`);
      }
    });

  if (
    (
      typeof options.fromCur !== 'string' ||
      !options.fromCur
    ) && (
      typeof options.toCur !== 'string' ||
      !options.toCur
    )
  ) {
    throw new Error('Either a fromCur or toCur must be provided as a non-empty string.');
  }

  const opts = { ...options };

  if (opts.fromCur && !opts.toCur) {
    opts.toCur = opts.fromCur;
  } else if (opts.toCur && !opts.fromCur) {
    opts.fromCur = opts.toCur;
  }

  return opts;
}

export default class extends baseVw {
  constructor(options = {}) {
    let opts = {
      ...options,
      initialState: {
        // These are documented in utils/currency/index.js in
        amount: undefined,
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
        tipClass: 'arrowBoxTipCenteredBot tx6 clrP clrBr clrT',
        ...options.initialState,
      },
    };

    opts = {
      ...opts,
      initialState: setCurs(opts.initialState),
    };

    // What happens if one cur is good and other wrong type?
    // What happens if one cur is good and other wrong type?
    // What happens if one cur is good and other wrong type?
    // What happens if one cur is good and other wrong type?
    // What happens if one cur is good and other wrong type?

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

  remove() {
    clearTimeout(this.copiedTimeout);
    super.remove();
  }

  render() {
    const state = this.getState();
    console.log(`my stateful amount is ${state.amount}`);
    console.log(`my fromCur is ${state.fromCur}`);
    console.log(`my toCur is ${state.toCur}`);

    const formattedAmountOptions = this.getFormatOptions();

    console.dir(formattedAmountOptions);

    let formattedAmount = convertAndFormatCurrency(
      state.amount,
      state.fromCur,
      state.toCur,
      { formatOptions: formattedAmountOptions }
    );

    console.log(`step 1: ${formattedAmount}`);

    const maxZero =
      state.maxDisplayDecimalsOnZero > state.maxDisplayDecimals ?
        state.maxDisplayDecimalsOnZero : state.maxDisplayDecimals;

    let convertedAmount = state.amount;

    try {
      convertedAmount = convertCurrency(
        state.amount,
        state.fromCur,
        state.toCur
      );
    } catch (e) {
      // pass
    }

    console.log(`the converted amount is ${convertedAmount}`);
    const isResultZero =
      isFormattedResultZero(convertedAmount, maxZero);
    let isResultZeroFormattedOptions;
    let tipAmount;

    if (
      isResultZero ||
      (
        typeof state.truncateAfterChars === 'number' &&
        formattedAmount.length > state.truncateAfterChars
      )
    ) {
      if (isResultZero) {
        console.log(`for amount ${state.amount}, the result is indeed zero.`);
        isResultZeroFormattedOptions = {
          formatOptions: {
            ...this.getFormatOptions(),
            minDisplayDecimals: 2,
          },
        };

        formattedAmount = convertAndFormatCurrency(
          state.amount,
          state.fromCur,
          state.toCur,
          {
            formatOptions: isResultZeroFormattedOptions,
          }
        );

        console.log(`the fAmount is ${formattedAmount}`);
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

      // In order for the ellipses to be placed at the end of the truncated
      // number (e.g. "1,538... ZEC") as opposed to at the end of the full
      // string (e.g. "1,538 ZEC..."), we will attempt to isolate the number
      // from the any currency symbol code. This is only do-able if the number
      // in the "decimal" style is exactly the same in the "currency" style.
      // For 98% of locales this is the case. For the ones it's not, we'll
      // just elipsify after the full string (latter case in the example above).

      const decimalFormattedAmountOptions = isResultZero ?
        isResultZeroFormattedOptions : formattedAmountOptions;

      const decimalFormattedAmount = convertAndFormatCurrency(
        state.amount,
        state.fromCur,
        state.toCur,
        {
          formatOptions: {
            ...decimalFormattedAmountOptions,
            style: 'decimal',
          },
        }
      );

      if (formattedAmount.includes(decimalFormattedAmount)) {
        let truncateCharPos = state.truncateAfterChars;
        let checkCharAt = truncateCharPos - 1;
        let goBackMost = 5;

        // try to truncate on a integer
        while (checkCharAt > 1 && goBackMost > 0) {
          if (
            isNaN(
              parseInt(
                decimalFormattedAmount[checkCharAt],
                10
              )
            )
          ) {
            truncateCharPos = checkCharAt;
            break;
          }

          checkCharAt -= 1;
          goBackMost -= 1;
        }

        const decimalEllipsified = app.polyglot.t('value.truncatedValue.message', {
          value: decimalFormattedAmount.slice(0, truncateCharPos),
          ellipse: '…',
        });

        formattedAmount = formattedAmount.replace(
          decimalFormattedAmount,
          decimalEllipsified
        );
      } else {
        formattedAmount = app.polyglot.t('value.truncatedValue.message', {
          value: formattedAmount.slice(0, state.truncateAfterChars),
          ellipse: '…',
        });
      }
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
