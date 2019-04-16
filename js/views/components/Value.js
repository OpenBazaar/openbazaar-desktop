import _ from 'underscore';
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
        ...options.initialState,
      },
    };

    super(opts);
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

    // <span class="clrT2 hide js-copiedIndicator">Copied</span>
    // <button
    //   class="js-copyTipAmount btnAsLink"

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

  getFormatOptionsFromState() {
    // todo: should this enumerate the ones to include rather than exclude?
    const nonFormatKeys = [
      'truncateAfterChars',
      'tooltipOnTruncatedZero',
      'tipWrapBaseClass',
      'tipWrapClass',
      'tipBaseClass',
      'tipClass',
      'copiedIndicatorOn',
    ];

    return _.omit(this.getState(), nonFormatKeys);
  }

  // doc me up
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
