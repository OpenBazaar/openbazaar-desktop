/*
  This view is also used by the Order Detail overlay. If you make any changes, please
  ensure they are compatible with both the Purchase and Order Detail flows.
*/

import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { formatCurrency, integerToDecimal } from '../../../utils/currency';
import { getServerCurrency } from '../../../data/cryptoCurrencies';
import { getSocket } from '../../../utils/serverConnect';
import BaseVw from '../../baseVw';
import SpendConfirmBox from '../wallet/SpendConfirmBox';
import qr from 'qr-encode';
import { clipboard, remote } from 'electron';
import { spend } from '../../../models/wallet/Spend';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { launchWallet } from '../../../utils/modalManager';
import { recordEvent } from '../../../utils/metrics';

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

    super(options);
    this.options = options;
    this._balanceRemaining = options.balanceRemaining;
    this.paymentAddress = getServerCurrency().qrCodeText(options.paymentAddress);
    this.orderId = options.orderId;
    this.isModerated = options.isModerated;

    const serverSocket = getSocket();
    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // listen for a payment socket message, to react to payments from all sources
        if (e.jsonData.notification && e.jsonData.notification.type === 'payment') {
          if (e.jsonData.notification.orderId === this.orderId) {
            const amount = integerToDecimal(e.jsonData.notification.fundingTotal,
              app.serverConfig.cryptoCurrency);
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
      'click .js-payFromAlt': 'clickPayFromAlt',
      'click .js-amountRow': 'copyAmount',
      'click .js-addressRow': 'copyAddress',
      'click .js-fundWallet': 'clickFundWallet',
    };
  }

  clickPayFromWallet(e) {
    const insufficientFunds = this.balanceRemaining > app.walletBalance.get('confirmed');

    if (insufficientFunds) {
      this.spendConfirmBox.setState({
        show: true,
        fetchFailed: true,
        fetchError: 'ERROR_INSUFFICIENT_FUNDS',
      });
      recordEvent('Purchase_PayFromWallet', {
        currency: getServerCurrency().code,
        sufficientFunds: false,
      });
    } else {
      recordEvent('Purchase_PayFromWallet', {
        currency: getServerCurrency().code,
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
    const currency = getServerCurrency().code;
    const addressNoPrefix = this.paymentAddress.split(":")[1]
      
    try {
      spend({
        address: addressNoPrefix,
        amount: this.balanceRemaining,
        currency,
      })
        .done(() => {
          recordEvent('Purchase_SpendFromWallet', {
            currency,
            errors: 'none',
          });
        })
        .fail(jqXhr => {
          const err = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';
          this.showSpendError(err);
          recordEvent('Purchase_SpendFromWallet', {
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

  clickPayFromAlt() {
    const amount = this.balanceRemaining;
    const serverCur = getServerCurrency().code;
    const shapeshiftURL = `https://shapeshift.io/shifty.html?destination=${this.paymentAddress}&output=${serverCur}&apiKey=6e9fbc30b836f85d339b84f3b60cade3f946d2d49a14207d5546895ecca60233b47ec67304cdcfa06e019231a9d135a7965ae50de0a1e68d6ec01b8e57f2b812&amount=${amount}`;
    const shapeshiftWin = new remote.BrowserWindow({ width: 700, height: 500, frame: true });
    shapeshiftWin.loadURL(shapeshiftURL);
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
      { amountBTC: formatCurrency(this.balanceRemaining, getServerCurrency().code) });
  }

  get qrDataUri() {
    const URL = `${this.paymentAddress}?amount=${this.balanceRemaining}`;
    return qr(URL, { type: 8, size: 5, level: 'Q' });
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
        }));
      });

      this.spendConfirmBox = this.createChild(SpendConfirmBox, {
        initialState: {
          btnSendText: app.polyglot.t('purchase.pendingSection.btnConfirmedPay'),
        },
      });
      this.listenTo(this.spendConfirmBox, 'clickSend', this.walletConfirm);
      this.getCachedEl('.js-confirmWalletContainer').html(this.spendConfirmBox.render().el);
    });

    return this;
  }
}
