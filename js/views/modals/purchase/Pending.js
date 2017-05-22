import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { convertAndFormatCurrency } from '../../../utils/currency';
import BaseVw from '../../baseVw';
import ConfirmWallet from './confirmWallet';
import qr from 'qr-encode';
import { clipboard } from 'electron';
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
  }

  className() {
    return 'pending pad';
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
      .done(data => {
        this.trigger('walletPaymentComplete', data);
      })
      .fail(jqXhr => {
        openSimpleMessage(app.polyglot.t('purchase.errors.paymentFailed'),
          jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
      })
      .always(() => {
        this.$confirmWalletConfirm.removeClass('processing');
      });
  }

  clickPayFromAlt() {

  }

  copyAmount() {
    clipboard.writeText(String(this.model.get('amount')));

    this.$copyAmountNotification.addClass('active');
    if (this.hideCopyAmountTimer) {
      clearTimeout(this.hideCopyAmountTimer);
    }
    this.hideCopyAmountTimer = setTimeout(
      () => this.$copyAmountNotification.removeClass('active'), 3000);
  }

  copyAddress() {
    clipboard.writeText(String(this.model.get('paymentAddress')));

    this.$copyAddressNotification.addClass('active');
    if (this.hideCopyAddressTimer) {
      clearTimeout(this.hideCopyAddressTimer);
    }
    this.hideCopyAddressTimer = setTimeout(
      () => this.$copyAddressNotification.removeClass('active'), 3000);
  }

  get $confirmWallet() {
    return this._$confirmWallet ||
      (this._$confirmWallet = this.$('.js-confirmWallet'));
  }

  get $copyAmountNotification() {
    return this._$copyAmountNotification ||
      (this._$copyAmountNotification = this.$('.js-copyAmountNotification'));
  }

  get $copyAddressNotification() {
    return this._$copyAddressNotification ||
      (this._$copyAddressNotification = this.$('.js-copyAddressNotification'));
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
      this._$copyAmountNotification = null;
      this._$copyAddressNotification = null;
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
