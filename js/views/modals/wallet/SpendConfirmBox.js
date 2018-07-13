import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { estimateFee } from '../../../utils/fees';
import { startAjaxEvent, endAjaxEvent, recordEvent } from '../../../utils/metrics';
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
      displayCurrency: app.settings.get('localCurrency') || 'BTC',
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

  /** Records the event. If no origin was passed in nothing will be recorded.
   * @param eventName(string)
   * @paren opts(object)
   */
  recordInternalEvent(eventName, opts) {
    if (this.metricsOrigin) recordEvent(`${this.metricsOrigin}_${eventName}`, { ...opts });
  }

  /** Ends an AJAX event. If no origin was passed in nothing will be recorded.
   * @param eventName(string)
   * @paren opts(object)
   */
  endInternalAjaxEvent(eventName, opts) {
    if (this.metricsOrigin) endAjaxEvent(`${this.metricsOrigin}_${eventName}`, { ...opts });
  }

  onClickSend(e) {
    this.trigger('clickSend');
    e.stopPropagation();
    this.recordInternalEvent('ConfirmBoxSend');
  }

  onClickCancel(e) {
    this.setState({ show: false });
    e.stopPropagation();
    this.recordInternalEvent('ConfirmBoxCancel');
  }

  onClickRetry(e) {
    const amount = this.lastFetchFeeEstimateArgs.amount;
    if (typeof amount === 'number') {
      this.fetchFeeEstimate(amount, this.lastFetchFeeEstimateArgs.feeLevel || null);
    }
    e.stopPropagation();
    this.recordInternalEvent('ConfirmBoxRetry');
  }

  fetchFeeEstimate(amount, feeLevel = app.localSettings.get('defaultTransactionFee')) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide an amount as a number.');
    }

    this.lastFetchFeeEstimateArgs = {
      amount,
      feeLevel,
    };

    this.setState({
      fetchingFee: true,
      fetchError: '',
      fetchFailed: false,
    });

    if (this.metricsOrigin) startAjaxEvent(`${this.metricsOrigin}_ConfirmBoxEstimateFee`);

    estimateFee(feeLevel, amount)
      .done(fee => {
        let state = {
          fee,
          fetchingFee: false,
        };

        if (fee + amount > app.walletBalance.get('confirmed')) {
          state = {
            // The fetch didn't actually fail, but since the server allows unconfirmed spends and
            // we don't want to allow that, we'll pretend it failed and simulate the server
            // ERROR_INSUFFICIENT_FUNDS error.
            fetchFailed: true,
            fetchError: 'ERROR_INSUFFICIENT_FUNDS',
            ...state,
          };
          this.endInternalAjaxEvent('ConfirmBoxEstimateFee', {
            errors: 'ERROR_INSUFFICIENT_FUNDS',
          });
        } else {
          this.endInternalAjaxEvent('ConfirmBoxEstimateFee');
        }

        this.setState(state);
      }).fail(xhr => {
        const fetchError = xhr && xhr.responseJSON && xhr.responseJSON.reason || '';
        this.setState({
          fetchingFee: false,
          fetchFailed: true,
          fetchError,
        });

        this.endInternalAjaxEvent('ConfirmBoxEstimateFee', {
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
