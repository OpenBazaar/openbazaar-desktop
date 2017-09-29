/*
  This view is also used by the Order Detail overlay. If you make any changes, please
  ensure they are compatible with both the Purchase and Order Detail flows.
*/

import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { formatCurrency, integerToDecimal } from '../../../utils/currency';
import { getSocket } from '../../../utils/serverConnect';
import BaseVw from '../../baseVw';
import SpendConfirmBox from '../wallet/SpendConfirmBox';
import qr from 'qr-encode';
import { clipboard, remote } from 'electron';
import { spend } from '../../../models/wallet/Spend';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import { launchWallet } from '../../../utils/modalManager';

export default class extends BaseVw {
  constructor(options = {}) {
    if (typeof options.balanceRemaining !== 'number') {
      throw new Error('Please provide the balance remaining in BTC as a number.');
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
    this.paymentAddress = options.paymentAddress;
    this.orderId = options.orderId;
    this.isModerated = options.isModerated;

    const serverSocket = getSocket();
    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // listen for a payment socket message, to react to payments from all sources
        if (e.jsonData.notification && e.jsonData.notification.type === 'payment') {
          if (e.jsonData.notification.orderId === this.orderId) {
            const amount = integerToDecimal(e.jsonData.notification.fundingTotal, true);
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
      this.confirmWallet.render();
      this.$amountDueLine.html(this.amountDueLine);
      this.$qrCodeImg.attr('src', this.qrDataUri);
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
      'click .js-copyAmount': 'copyAmount',
      'click .js-copyAddress': 'copyAddress',
      'click .js-fundWallet': 'clickFundWallet',
    };
  }

  clickPayFromWallet(e) {
    const insufficientFunds = this.balanceRemaining > app.walletBalance.get('confirmed');
    this.spendConfirmBox.setState({
      show: true,
      fetchFailed: true,
    });

    if (!insufficientFunds) {
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

    try {
      spend({
        address: this.paymentAddress,
        amount: this.balanceRemaining,
        currency: 'BTC',
      })
        .fail(jqXhr => {
          this.showSpendError(jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
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
    const shapeshiftURL = `https://shapeshift.io/shifty.html?destination=${this.paymentAddress}&amp;output=BTC&apiKey=6e9fbc30b836f85d339b84f3b60cade3f946d2d49a14207d5546895ecca60233b47ec67304cdcfa06e019231a9d135a7965ae50de0a1e68d6ec01b8e57f2b812&amount=${amount}`;
    const shapeshiftWin = new remote.BrowserWindow({ width: 700, height: 500, frame: true });
    shapeshiftWin.loadURL(shapeshiftURL);
  }

  copyAmount() {
    clipboard.writeText(String(this.balanceRemaining));

    this.$copyAmount.addClass('active');
    if (this.hideCopyAmountTimer) {
      clearTimeout(this.hideCopyAmountTimer);
    }
    this.hideCopyAmountTimer = setTimeout(
      () => this.$copyAmount.removeClass('active'), 3000);
  }

  copyAddress() {
    clipboard.writeText(String(this.paymentAddress));

    this.$copyAddress.addClass('active');
    if (this.hideCopyAddressTimer) {
      clearTimeout(this.hideCopyAddressTimer);
    }
    this.hideCopyAddressTimer = setTimeout(
      () => this.$copyAddress.removeClass('active'), 3000);
  }

  clickFundWallet() {
    launchWallet().sendModeOn = false;
  }

  get amountDueLine() {
    return app.polyglot.t('purchase.pendingSection.pay',
      { amountBTC: formatCurrency(this.balanceRemaining, 'BTC') });
  }

  get qrDataUri() {
    const btcURL = `bitcoin:${this.paymentAddress}?amount=${this.balanceRemaining}`;
    return qr(btcURL, { type: 8, size: 5, level: 'Q' });
  }

  get $copyAmount() {
    return this._$copyAmount ||
      (this._$copyAmount = this.$('.js-copyAmount'));
  }

  get $copyAddress() {
    return this._$copyAddress ||
      (this._$copyAddress = this.$('.js-copyAddress'));
  }

  get $amountDueLine() {
    return this._$amountDueLine ||
      (this._$amountDueLine = this.$('.js-amountDueLine'));
  }

  get $qrCodeImg() {
    return this._$qrCodeImg ||
      (this._$qrCodeImg = this.$('.js-qrCodeImg'));
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

      this._$copyAmount = null;
      this._$copyAddress = null;
      this._$amountDueLine = null;
      this._$qrCodeImg = null;

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
