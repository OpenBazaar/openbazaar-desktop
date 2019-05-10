import $ from 'jquery';
import app from '../../../app';
import { swallowException } from '../../../utils';
import loadTemplate from '../../../utils/loadTemplate';
import { isValidCoinDivisibility } from '../../../utils/crypto';
import { estimateFee } from '../../../utils/fees';
import {
  startPrefixedAjaxEvent,
  endPrefixedAjaxEvent,
  recordPrefixedEvent,
} from '../../../utils/metrics';
import baseVw from '../../baseVw';
import PairedCurrency from '../../components/value/PairedCurrency';
import { short, full } from '../../components/value/valueConfigs';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      ...options,
      initialState: {
        show: false,
        fetchingFee: false,
        fetchFailed: false,
        fetchError: '',
        fee: false,
        coinType: '',
        btnSendText: app.polyglot.t('wallet.spendConfirmBox.btnConfirmSend'),
        coinDiv: undefined,
        ...options.initialState || {},
      },
    });

    this.lastFetchFeeEstimateArgs = [];
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
    this.fetchFeeEstimate(...this.lastFetchFeeEstimateArgs);
    e.stopPropagation();
    recordPrefixedEvent('ConfirmBoxRetry', this.metricsOrigin);
  }

  setState(state, options) {
    const fullState = {
      ...this.getState(),
      ...state,
    };

    const [isValidCoinDiv, coinDivErr] = isValidCoinDivisibility(fullState.coinDiv);

    if (!isValidCoinDiv) {
      throw new Error(coinDivErr);
    }

    return super.setState(state, options);
  }

  fetchFeeEstimate(
    amount,
    coinType = this.getState().coinType,
    coinDiv = this.getState().coinDiv,
    feeLevel = app.localSettings.get('defaultTransactionFee')
  ) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide an amount as a number.');
    }

    if (typeof coinType !== 'string' || !coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    this.lastFetchFeeEstimateArgs = [
      amount,
      coinType,
      coinDiv,
      feeLevel,
    ];

    this.setState({
      fetchingFee: true,
      fetchError: '',
      fetchFailed: false,
      coinType,
    });

    startPrefixedAjaxEvent('ConfirmBoxEstimateFee', this.metricsOrigin);

    estimateFee(coinType, coinDiv, feeLevel, amount)
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
    super.render();
    
    loadTemplate('modals/wallet/spendConfirmBox.html', (t) => {
      const state = this.getState();

      this.$el.html(t({
        ...state,
      }));

      if (this.feeText) this.feeText.remove();

      if (typeof state.fee === 'number') {
        swallowException(() => {
          const toCur = app.settings.get('localCurrency');
          const amount = state.fee;

          this.feeText = this.createChild(PairedCurrency, {
            initialState: {
              fromCurValueOptions: {
                initialState: {
                  ...full({
                    toCur: state.coinType,
                  }),
                  toCur: state.coinType,
                  amount,
                  truncateAfterChars: 20,
                },
              },
              toCurValueOptions: {
                initialState: {
                  ...short({
                    fromCur: state.coinType,
                    toCur,
                  }),
                  fromCur: state.coinType,
                  toCur,
                  amount,
                },
              },
            },
          });

          this.getCachedEl('.js-feeText')
            .html(this.feeText.render().el);
        });
      }
    });

    return this;
  }
}
