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
import Order from '../../../models/purchase/Order';
import { spend } from '../../../models/wallet/Spend';
import { openSimpleMessage } from '../../modals/SimpleMessage';

export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model || !options.model instanceof Purchase) {
      throw new Error('Please provide a purchase model.');
    }

    if (!options.order || !options.model instanceof Order) {
      throw new Error('Please provide an order model.');
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
            this.trigger('walletPaymentComplete', payment);
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
        if (this.isRemoved()) return;
        this.$confirmWalletConfirm.removeClass('processing');
        this.$confirmWallet.addClass('hide');
      });
  }

  clickPayFromAlt() {
    const amount = this.model.get('amount');
    const shapeshiftURL = `https://shapeshift.io/shifty.html?destination=${this.payURL}&amp;output=BTC&apiKey=6e9fbc30b836f85d339b84f3b60cade3f946d2d49a14207d5546895ecca60233b47ec67304cdcfa06e019231a9d135a7965ae50de0a1e68d6ec01b8e57f2b812&amount=${amount}`;
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

  remove() {
    $(document).off('click', this.boundOnDocClick);
    super.remove();
  }

  render() {
    const displayCurrency = app.settings.get('localCurrency');
    const amount = this.model.get('amount');
    const amountBTC = amount ? convertAndFormatCurrency(amount, 'BTC', 'BTC') : 0;

    const btcURL = `bitcoin:${this.model.get('paymentAddress')}?amount=${amount}`;

    loadTemplate('modals/purchase/payment.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          ...this.model.toJSON(),
          displayCurrency,
          amount,
          amountBTC,
          qrDataUri: qr(btcURL, { type: 6, size: 5, level: 'Q' }),
          walletIconTmpl,
          moderator: this.options.order.get('moderator'),
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
