import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseVw from '../../baseVw';
import qr from 'qr-encode';
import { clipboard } from 'electron';


export default class extends BaseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
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
      'click .js-confirmWalletCancel': 'clickWalletCancel',
      'click .js-confirmWalletConfirm': 'clickWalletConfirm',
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

  clickWalletCancel() {
    this.$confirmWallet.addClass('hide');
  }

  clickWalletConfirm() {

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

  render() {
    loadTemplate('modals/purchase/pending.html', (t) => {
      loadTemplate('walletIcon.svg', (walletIconTmpl) => {
        this.$el.html(t({
          displayCurrency: app.settings.get('localCurrency'),
          qrDataUri: qr(`bitcoin:${this.options.paymentAddress}`,
            { type: 6, size: 5, level: 'Q' }),
          walletIconTmpl,
          ...this.model.toJSON(),
        }));
      });

      this._$confirmWallet = null;
      this._$copyAmountNotification = null;
      this._$copyAddressNotification = null;
    });

    return this;
  }
}
