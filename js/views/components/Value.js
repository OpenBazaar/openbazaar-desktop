import _ from 'underscore';
import app from '../../app';
import { convertAndFormatCurrency } from '../../utils/currency';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        // Most of these options map to the options in formatCurrency and/or
        // convertCurrency of util/currency and are documented there.
        // valiudate to be number
        amount: undefined,
        // validate to be string
        fromCur: 'USD',
        // validate to be string
        toCur: 'USD',
        locale: app && app.localSettings &&
          app.localSettings.standardizedTranslatedLang() || 'en-US',
        btcUnit: app && app.localSettings &&
          app.localSettings.get('bitcoinUnit') || 'BTC',
        useCryptoSymbol: true,
        minDisplayDecimals: 2,
        maxDisplayDecimals: 2,
        maxDisplayDecimalsOnZero: 6,
        // false or a number of chars
        truncateAfterChars: false,
        tooltipOnTruncatedZero: true,
        tipWrapBaseClass: 'arrowBoxTipWrap',
        tipWrapClass: 'unconstrainedWidth',
        tipBaseClass: 'js-formatCurTip',
        tipClass: 'arrowBoxTipCenteredBot clrP clrBr',
        copyableTipAmount: true,
        ...options.initialState,
      },
    };

    super(opts);
  }

  events() {
    return {
      // 'click .js-block': 'onClickBlock',
    };
  }

  // onClickBlock(e) {
  // }

  getFormatOptionsFromState() {
    // todo: should this enumerate the ones to include rather than exclude?
    const nonFormatKeys = [
      'truncateAfterChars',
      'tooltipOnTruncatedZero',
      'tipWrapBaseClass',
      'tipWrapClass',
      'tipBaseClass',
      'tipClass',
    ];

    return _.omit(this.getState(), nonFormatKeys);
  }

  // doc me up
  isResultZero(amount, maxDecimals) {
    return amount < parseFloat(`.${'0'.repeat(maxDecimals - 1)}1`);
  }

  render() {
    const state = this.getState();
    let formattedAmount = convertAndFormatCurrency(
      state.amount,
      state.fromCur,
      state.toCur,
      {
        // should this really be seperate
        formatOptions:
          this.getFormatOptionsFromState(),
      }
    );
    let tipAmount;

    if (
      this.isResultZero(state.amount, state.maxDisplayDecimals) ||
      (
        typeof state.truncateAfterChars === 'number' &&
        formattedAmount.length > state.truncateAfterChars
      )
    ) {
      tipAmount = convertAndFormatCurrency(
        state.amount,
        state.fromCur,
        state.toCur,
        {
          // should this really be seperate
          formatOptions: {
            ...this.getFormatOptionsFromState(),
            minDisplayDecimals: 2,
            // if greater than zero, this should be 2 on fiat and
            // base units on crypto.
            // if zero, this should be 20.
            maxDisplayDecimals: 20,
            maxDisplayDecimalsOnZero: 20,
          },
        }
      );

      // todo: placement of the ellipse and maybe ven the ellipse should be in
      // the translation file
      formattedAmount = `${formattedAmount}`;
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
