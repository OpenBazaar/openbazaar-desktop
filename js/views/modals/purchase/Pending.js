import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { convertAndFormatCurrency, integerToDecimal } from '../../../utils/currency';
import { getSocket } from '../../../utils/serverConnect';
import BaseVw from '../../baseVw';
import ConfirmWallet from './ConfirmWallet';
import qr from 'qr-encode';
import { clipboard, remote } from 'electron';
import Purchase from '../../../models/purchase/Purchase';
import { spend } from '../../../models/wallet/Spend';
import { openSimpleMessage } from '../../modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model || !options.model instanceof Purchase) {
      throw new Error('Please provide a purchase model.');
    }

    super(options);
    this.options = options;

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);

    const serverSocket = getSocket();
    if (serverSocket) {
      this.listenTo(serverSocket, 'message', e => {
        // listen for a payment socket message, to react to payments from all sources
        if (e.jsonData.notification && e.jsonData.notification.payment) {
          const payment = e.jsonData.notification.payment;
          if (integerToDecimal(payment.fundingTotal, true) >= this.model.get('amount') &&
            payment.orderId === this.model.get('orderId')) {
            this.trigger('walletPaymentComplete');
          }
        }
      });
    }
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
    };
  }

  onDocumentClick(e) {
    if (!($.contains(this.$confirmWallet[0], e.target))) {
      this.$confirmWallet.addClass('hide');
    }
  }

  clickPayFromWallet(e) {
    e.stopPropagation();
    this.$confirmWallet.removeClass('hide');
  }

  walletCancel() {
    this.$confirmWallet.addClass('hide');
  }

  walletConfirm() {
    this.$confirmWalletConfirm.addClass('processing');

    spend({
      address: this.model.get('paymentAddress'),
      amount: this.model.get('amount'),
      currency: 'BTC',
    })
      .fail(jqXhr => {
        openSimpleMessage(app.polyglot.t('purchase.errors.paymentFailed'),
          jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
      })
      .always(() => {
        this.$confirmWalletConfirm.removeClass('processing');
        this.$confirmWallet.addClass('hide');
      });
  }

  clickPayFromAlt() {
    const amount = this.model.get('amount');
    const shapeshiftURL = `https://shapeshift.io/shifty.html?destination=${this.payURL}&amp;output=BTC&apiKey=407531b0fa5d84a3c0d335c54d1ae7d5939f05b45aa90cf4d5dcfdca22c4be13f68a24a0d5ce6f1bbc5bd51b3cc0bc8a165254d29af6b8fb377d85287b747d41&amount=${amount}`;
    const shapeshiftWin = new remote.BrowserWindow({ width: 700, height: 500, frame: true });
    shapeshiftWin.loadURL(shapeshiftURL);
  }

  copyAmount() {
    clipboard.writeText(String(this.model.get('amount')));

    this.$copyAmount.addClass('active');
    if (this.hideCopyAmountTimer) {
      clearTimeout(this.hideCopyAmountTimer);
    }
    this.hideCopyAmountTimer = setTimeout(
      () => this.$copyAmount.removeClass('active'), 3000);
  }

  copyAddress() {
    clipboard.writeText(String(this.model.get('paymentAddress')));

    this.$copyAddress.addClass('active');
    if (this.hideCopyAddressTimer) {
      clearTimeout(this.hideCopyAddressTimer);
    }
    this.hideCopyAddressTimer = setTimeout(
      () => this.$copyAddress.removeClass('active'), 3000);
  }

  get $confirmWallet() {
    return this._$confirmWallet ||
      (this._$confirmWallet = this.$('.js-confirmWallet'));
  }

  get $copyAmount() {
    return this._$copyAmount ||
      (this._$copyAmount = this.$('.js-copyAmount'));
  }

  get $copyAddress() {
    return this._$copyAddress ||
      (this._$copyAddress = this.$('.js-copyAddress'));
  }

  get $confirmWalletConfirm() {
    return this._$confirmWalletConfirm ||
      (this._$confirmWalletConfirm = this.$('.js-confirmWalletConfirm'));
  }

  render() {
    const displayCurrency = app.settings.get('localCurrency');
    const amount = this.model.get('amount');
    const amountBTC = amount ? convertAndFormatCurrency(amount, 'BTC', 'BTC') : 0;

    loadTemplate('modals/purchase/pending.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          displayCurrency,
          amount,
          amountBTC,
          qrDataUri: qr(`bitcoin:${this.options.paymentAddress}`,
            { type: 6, size: 5, level: 'Q' }),
          walletIconTmpl,
          ...this.model.toJSON(),
        }));
      });

      this._$confirmWallet = null;
      this._$copyAmount = null;
      this._$copyAddress = null;
      this._$confirmWalletConfirm = null;

      // remove old view if any on render
      if (this.confirmWallet) this.confirmWallet.remove();
      // add the confirmWallet view
      this.confirmWallet = this.createChild(ConfirmWallet, {
        displayCurrency,
        amount,
        amountBTC,
      });
      this.listenTo(this.confirmWallet, 'walletCancel', () => this.walletCancel());
      this.listenTo(this.confirmWallet, 'walletConfirm', () => this.walletConfirm());
      this.$confirmWallet.append(this.confirmWallet.render().el);
    });

    return this;
  }
}
