import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { estimateFee } from '../../../utils/fees';
import {
  startPrefixedAjaxEvent,
  endPrefixedAjaxEvent,
  recordPrefixedEvent,
} from '../../../utils/metrics';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);

    this._state = {
      show: false,
      fetchingFee: false,
      fetchFailed: false,
      fetchError: '',
      fee: false,
      coinType: '',
      displayCurrency: app.settings.get('localCurrency') || 'USD',
      btnSendText: app.polyglot.t('wallet.spendConfirmBox.btnConfirmSend'),
      ...options.initialState || {},
    };

    this.lastFetchFeeEstimateArgs = {};
    this.metricsOrigin = options.metricsOrigin;
    this.boundDocumentClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundDocumentClick);
  }

  className() {
    return 'spendConfirmBox centeredBelow';
  }

  events() {
    return {
      'click .js-btnConfirmSend': 'onClickSend',
      'click .js-sendConfirmCancel': 'onClickCancel',
      'click .js-sendConfirmRetry': 'onClickRetry',
      'click .js-sendConfirmClose': 'onClickCancel',
    };
  }

  onDocumentClick(e) {
    if (this.getState().show &&
      !($.contains(this.el, e.target) ||
        e.target === this.el)) {
      this.setState({ show: false });
    }
  }

  onClickSend(e) {
    this.trigger('clickSend');
    e.stopPropagation();
    recordPrefixedEvent('ConfirmBoxSend', this.metricsOrigin);
  }

  onClickCancel(e) {
    this.setState({ show: false });
    e.stopPropagation();
    recordPrefixedEvent('ConfirmBoxCancel', this.metricsOrigin);
  }

  onClickRetry(e) {
    const amount = this.lastFetchFeeEstimateArgs.amount;
    if (typeof amount === 'number') {
      this.fetchFeeEstimate(...this.lastFetchFeeEstimateArgs);
    }
    e.stopPropagation();
    recordPrefixedEvent('ConfirmBoxRetry', this.metricsOrigin);
  }

  fetchFeeEstimate(
    amount,
    coinType = this.getState().coinType,
    feeLevel = app.localSettings.get('defaultTransactionFee')) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide an amount as a number.');
    }

    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    this.lastFetchFeeEstimateArgs = {
      amount,
      coinType,
      feeLevel,
    };

    this.setState({
      fetchingFee: true,
      fetchError: '',
      fetchFailed: false,
      coinType,
    });

    startPrefixedAjaxEvent('ConfirmBoxEstimateFee', this.metricsOrigin);

    estimateFee(coinType, feeLevel, amount)
      .done(fee => {
        let state = {
          fee,
          fetchingFee: false,
        };

        if (app.walletBalances && app.walletBalances.get(coinType) &&
          fee + amount > app.walletBalances.get(coinType).get('confirmed')) {
          state = {
            // The fetch didn't actually fail, but since the server allows unconfirmed spends and
            // we don't want to allow that, we'll pretend it failed and simulate the server
            // ERROR_INSUFFICIENT_FUNDS error.
            fetchFailed: true,
            fetchError: 'ERROR_INSUFFICIENT_FUNDS',
            ...state,
          };
          endPrefixedAjaxEvent('ConfirmBoxEstimateFee', this.metricsOrigin, {
            errors: 'ERROR_INSUFFICIENT_FUNDS',
          });
        } else {
          endPrefixedAjaxEvent('ConfirmBoxEstimateFee', this.metricsOrigin, {
            errors: 'none',
          });
        }

        this.setState(state);
      }).fail(xhr => {
        const fetchError = xhr && xhr.responseJSON && xhr.responseJSON.reason || '';
        this.setState({
          fetchingFee: false,
          fetchFailed: true,
          fetchError,
        });

        endPrefixedAjaxEvent('ConfirmBoxEstimateFee', this.metricsOrigin, {
          errors: fetchError || 'unknown error',
        });
      });
  }

  remove() {
    $(document).off('click', this.boundDocumentClick);
    super.remove();
  }

  render() {
    loadTemplate('modals/wallet/spendConfirmBox.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));
    });

    return this;
  }
}
