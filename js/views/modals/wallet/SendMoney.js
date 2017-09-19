import $ from 'jquery';
import app from '../../../app';
import '../../../lib/select2';
import { getCurrenciesSortedByCode } from '../../../data/currencies';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import Spend, { spend } from '../../../models/wallet/Spend';
import { convertCurrency } from '../../../utils/currency';
import estimateFee from '../../../utils/fees';
import loadTemplate from '../../../utils/loadTemplate';
import SendConfirmBox from './SendConfirmBox';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this._saveInProgress = false;
    this._sendConfirmOn = false;
    this.model = new Spend();
    this.boundDocumentClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundDocumentClick);
  }

  className() {
    return 'sendMoney';
  }

  events() {
    return {
      'click .js-btnSend': 'onClickSend',
      'click .js-sendMoneyClear': 'onClickClear',
    };
  }

  onDocumentClick(e) {
    if (this.isSendConfirmOn() &&
      !($.contains(this.$sendConfirm[0], e.target) ||
        e.target === this.$sendConfirm[0])) {
      this.setSendConfirmOn(false);
    }
  }

  onClickConfirmSend() {
    this.setSendConfirmOn(false);

    // POSTing payment to the server
    this.saveInProgress = true;

    spend({
      ...this.model.toJSON(),
      feeLevel: app.localSettings.get('defaultTransactionFee'),
    }).fail(jqXhr => {
      openSimpleMessage(app.polyglot.t('wallet.sendMoney.sendPaymentFailDialogTitle'),
        jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
    }).always(() => {
      this.saveInProgress = false;
    })
      .done(() => this.clearModel());
  }

  onClickSend() {
    const formData = this.getFormData(this.$formFields);
    this.model.set(formData);
    this.model.set({}, { validate: true });

    // render so errors are shown / cleared
    this.render();

    if (!this.model.validationError) {
      // timeout needed so the document click handler doesn't hide
      // our confirmation box
      setTimeout(() => {
        this.setSendConfirmOn(true);
        this.fetchFeeEstimate();
      });
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  onClickSendConfirmCancel() {
    this.setSendConfirmOn(false);
  }

  onClickClear() {
    this.clearForm();
  }

  focusAddress() {
    if (!this.saveInProgress) this.$addressInput.focus();
  }

  setFormData(data = {}, focusAddressInput = true) {
    this.clearForm();
    this.model.set(data);
    this.render();
    setTimeout(() => {
      if (focusAddressInput) this.focusAddress();
    });
  }

  clearModel() {
    // this.model.clear();

    // for some reason model.clear is not working, so we'll go
    // with a manual approach
    this.model.unset('address');
    this.model.unset('amount');
    this.model.unset('memo');
    this.model.unset('currency');
    this.model.set(this.model.defaults || {});
    this.model.validationError = null;
  }

  clearForm() {
    this.clearModel();
    this.render();
  }

  set saveInProgress(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a boolean.');
    }

    if (bool !== this.saveInProgress) {
      this._saveInProgress = bool;
      this.render();
    }
  }

  get saveInProgress() {
    return this._saveInProgress;
  }

  setSendConfirmOn(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a boolean.');
    }

    if (bool !== this.isSendConfirmOn()) {
      this._sendConfirmOn = bool;
      this.getCachedEl('.js-sendConfirm').toggleClass('hide', !bool);
    }
  }

  fetchFeeEstimate() {
    this.sendConfirmBox.setState({
      paymentAmount: this.model.get('amount'),
      paymentCurrency: this.model.get('currency'),
      fetchingFee: true,
      fetchError: '',
    });

    const amount = convertCurrency(this.model.get('amount'), this.model.get('currency'), 'BTC');
    estimateFee(app.localSettings.get('defaultTransactionFee'), amount)
      .done(fee => {
        this.sendConfirmBox.setState({
          fee,
          fetchingFee: false,
        });
      }).fail(xhr => {
        this.sendConfirmBox.setState({
          fetchingFee: false,
          fetchError: xhr && xhr.responseJSON && xhr.responseJSON.reason || '',
        });
      });
  }

  isSendConfirmOn() {
    return this._sendConfirmOn;
  }

  get $addressInput() {
    return this._$addressInput ||
      (this._$addressInput = this.$('#walletSendTo'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$(`select[name], input[name], 
        textarea[name]:not([class*="trumbowyg"]), 
        div[contenteditable][name]`));
  }

  get $btnSend() {
    return this._$btnSend ||
      (this._$btnSend = this.$('.js-btnSend'));
  }

  get $sendConfirm() {
    return this._$sendConfirm ||
      (this._$sendConfirm = this.$('.js-sendConfirm'));
  }

  remove() {
    $(document).off(null, this.boundDocumentClick);
    super.remove();
  }

  render() {
    super.render();
    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        currency: this.model.get('currency') || app.settings.get('localCurrency'),
        currencies: this.currencies ||
          getCurrenciesSortedByCode(),
        saveInProgress: this.saveInProgress,
        sendConfirmOn: this.isSendConfirmOn(),
      }));

      this._$addressInput = null;
      this._$formFields = null;
      this._$btnSend = null;
      this._$sendConfirm = null;

      this.$('#walletSendCurrency').select2();

      const sendConfirmBoxState = this.sendConfirmBox && this.sendConfirmBox.getState();
      if (this.sendConfirmBox) this.sendConfirmBox.remove();
      this.sendConfirmBox = this.createChild(SendConfirmBox, {
        initialState: { ...sendConfirmBoxState || {} },
      });
      this.listenTo(this.sendConfirmBox, 'clickSend', this.onClickConfirmSend);
      this.listenTo(this.sendConfirmBox, 'clickCancel', this.onClickSendConfirmCancel);
      this.listenTo(this.sendConfirmBox, 'clickClose', this.onClickSendConfirmCancel);
      this.listenTo(this.sendConfirmBox, 'clickRetry', e => {
        this.fetchFeeEstimate();
        e.originalEvent.stopPropagation();
      });
      this.$sendConfirm.html(this.sendConfirmBox.render().el);
    });

    return this;
  }
}
