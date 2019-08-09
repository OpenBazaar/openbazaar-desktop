/*
 This view is also used by the Order Detail overlay. If you make any changes, please
 ensure they are compatible with both the Purchase and Order Detail flows.
 */

import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { formatCurrency, integerToDecimal } from '../../../utils/currency';
import { getCurrencyByCode as getWalletCurByCode } from '../../../data/walletCurrencies';
import { getSocket } from '../../../utils/serverConnect';
import BaseVw from '../../baseVw';
import SpendConfirmBox from '../wallet/SpendConfirmBox';
import qr from 'qr-encode';
import { clipboard } from 'electron';
import { orderSpend } from '../../../models/wallet/Spend';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { launchWallet } from '../../../utils/modalManager';
import {
  startPrefixedAjaxEvent,
  endPrefixedAjaxEvent,
  recordPrefixedEvent,
} from '../../../utils/metrics';

export default class extends BaseVw {
  constructor(options = {}) {
    if (typeof options.balanceRemaining !== 'number') {
      throw new Error('Please provide the balance remaining (in the server\'s' +
        ' currency) as a number.');
    }

    if (!options.paymentAddress) {
      throw new Error('Please provide the payment address.');
    }

    if (!options.orderId) {
      throw new Error('Please provide an orderId.');
    }

    if (typeof options.isModerated !== 'boolean') {
      throw new Error('Please provide a boolean indicating whether the order is moderated.');
    }

    if (!options.metricsOrigin) {
      throw new Error('Please provide an origin for the metrics reporting');
    }

    let paymentCoinData;

    try {
      paymentCoinData = getWalletCurByCode(options.paymentCoin);
    } catch (e) {
      // pass
    }

    if (!paymentCoinData) {
      throw new Error(`Unable to obtain wallet currency data for "${options.paymentCoin}"`);
    }

    super(options);
    this.options = options;
    this._balanceRemaining = options.balanceRemaining;
    this.paymentAddress = options.paymentAddress;
    this.orderId = options.orderId;
    this.isModerated = options.isModerated;
    this.metricsOrigin = options.metricsOrigin;
    this.paymentCoin = options.paymentCoin;
    this.paymentCoinData = paymentCoinData;

    const serverSocket = getSocket();
    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // listen for a payment socket message, to react to payments from all sources
        if (e.jsonData.notification && e.jsonData.notification.type === 'payment') {
          if (e.jsonData.notification.orderId === this.orderId) {
            const amount = integerToDecimal(e.jsonData.notification.fundingTotal,
              this.paymentCoin);
            if (amount >= this.balanceRemaining) {
              this.getCachedEl('.js-payFromWallet').removeClass('processing');
              this.trigger('walletPaymentComplete', e.jsonData.notification);
            } else {
              // Ensure the resulting balance has a maximum of 8 decimal places without any
              // trailing zeros.
              this.balanceRemaining = parseFloat((this.balanceRemaining - amount).toFixed(8));
            }
          }
        }
      });
    }
  }

  set balanceRemaining(amount) {
    if (amount !== this._balanceRemaining) {
      this._balanceRemaining = amount;
      this.getCachedEl('.js-amountDueLine').html(this.amountDueLine);
      this.getCachedEl('.js-qrCodeImg').attr('src', this.qrDataUri);
    }
  }

  get balanceRemaining() {
    return this._balanceRemaining;
  }

  className() {
    return 'pending';
  }

  events() {
    return {
      'click .js-payFromWallet': 'clickPayFromWallet',
      'click .js-amountRow': 'copyAmount',
      'click .js-addressRow': 'copyAddress',
      'click .js-fundWallet': 'clickFundWallet',
    };
  }

  clickPayFromWallet(e) {
    const walletBalance = app.walletBalances.get(this.paymentCoin);
    const insufficientFunds = this.balanceRemaining >
     (walletBalance ? walletBalance.get('confirmed') : 0);

    if (insufficientFunds) {
      this.spendConfirmBox.setState({
        show: true,
        fetchFailed: true,
        fetchError: 'ERROR_INSUFFICIENT_FUNDS',
      });
      recordPrefixedEvent('PayFromWallet', this.metricsOrigin, {
        currency: this.paymentCoin,
        sufficientFunds: false,
      });
    } else {
      recordPrefixedEvent('PayFromWallet', this.metricsOrigin, {
        currency: this.paymentCoin,
        sufficientFunds: true,
      });
      this.spendConfirmBox.setState({ show: true });
      this.spendConfirmBox.fetchFeeEstimate(this.balanceRemaining);
    }

    e.stopPropagation();
  }

  showSpendError(error = '') {
    openSimpleMessage(app.polyglot.t('purchase.errors.paymentFailed'), error);
  }

  walletConfirm() {
    this.getCachedEl('.js-payFromWallet').addClass('processing');
    this.spendConfirmBox.setState({ show: false });
    const currency = this.paymentCoin;

    startPrefixedAjaxEvent('SpendFromWallet', this.metricsOrigin);

    try {
      orderSpend({
        orderId: this.orderId,
        address: this.paymentAddress,
        amount: this.balanceRemaining,
        currency,
        wallet: currency,
      })
        .done(() => {
          endPrefixedAjaxEvent('SpendFromWallet', this.metricsOrigin, { currency });
        })
        .fail(jqXhr => {
          const err = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
          this.showSpendError(err);
          endPrefixedAjaxEvent('SpendFromWallet', this.metricsOrigin, {
            currency,
            errors: err || 'unknown error',
          });
          if (this.isRemoved()) return;
          this.getCachedEl('.js-payFromWallet').removeClass('processing');
        });
    } catch (e) {
      // This is almost certainly a dev error if this happens, but it prevents the purchase and
      // is confusing and at least to make debugging easier, we'll display an error modal.
      this.showSpendError(e.message || '');
      this.getCachedEl('.js-payFromWallet').removeClass('processing');
    }
  }

  copyAmount() {
    clipboard.writeText(String(this.balanceRemaining));

    this.getCachedEl('.js-copyAmount').addClass('active');
    if (this.hideCopyAmountTimer) {
      clearTimeout(this.hideCopyAmountTimer);
    }
    this.hideCopyAmountTimer = setTimeout(
      () => this.getCachedEl('.js-copyAmount').removeClass('active'), 3000);
  }

  copyAddress() {
    clipboard.writeText(String(this.paymentAddress));

    this.getCachedEl('.js-copyAddress').addClass('active');
    if (this.hideCopyAddressTimer) {
      clearTimeout(this.hideCopyAddressTimer);
    }
    this.hideCopyAddressTimer = setTimeout(
      () => this.getCachedEl('.js-copyAddress').removeClass('active'), 3000);
  }

  clickFundWallet() {
    launchWallet().sendModeOn = false;
  }

  get amountDueLine() {
    return app.polyglot.t('purchase.pendingSection.pay',
      { amountBTC: formatCurrency(this.balanceRemaining, this.paymentCoin) });
  }

  get qrDataUri() {
    const address = this.paymentCoinData.qrCodeText(this.paymentAddress);
    const URL = `${address}?amount=${this.balanceRemaining}`;
    return qr(URL, { type: 8, size: 5, level: 'M' });
  }

  remove() {
    if (this.hideCopyAmountTimer) {
      clearTimeout(this.hideCopyAmountTimer);
    }
    super.remove();
  }

  render() {
    super.render();
    const displayCurrency = app.settings.get('localCurrency');

    loadTemplate('modals/purchase/payment.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          displayCurrency,
          amountDueLine: this.amountDueLine,
          paymentAddress: this.paymentAddress,
          qrDataUri: this.qrDataUri,
          walletIconTmpl,
          isModerated: this.isModerated,
          paymentCoin: this.paymentCoin,
        }));
      });

      this.spendConfirmBox = this.createChild(SpendConfirmBox, {
        metricsOrigin: this.metricsOrigin,
        initialState: {
          btnSendText: app.polyglot.t('purchase.pendingSection.btnConfirmedPay'),
          coinType: this.paymentCoin,
        },
      });
      this.listenTo(this.spendConfirmBox, 'clickSend', this.walletConfirm);
      this.getCachedEl('.js-confirmWalletContainer').html(this.spendConfirmBox.render().el);
    });

    return this;
  }
}
