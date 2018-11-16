import app from '../../../app';
import '../../../lib/select2';
import { getCurrenciesSortedByCode } from '../../../data/currencies';
import { endAjaxEvent, recordEvent, startAjaxEvent } from '../../../utils/metrics';
import { convertCurrency, getExchangeRate } from '../../../utils/currency';
import loadTemplate from '../../../utils/loadTemplate';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import Spend, { spend } from '../../../models/wallet/Spend';
import SendConfirmBox from './SpendConfirmBox';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (typeof options.coinType !== 'string' || !options.coinType) {
      throw new Error('Please provide the coinType as a string.');
    }

    super(options);
    this.coinType = options.coinType;
    this._saveInProgress = false;
    this._sendConfirmOn = false;
    this.model = new Spend({ wallet: options.coinType });
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

  onClickConfirmSend() {
    this.sendConfirmBox.setState({ show: false });

    // POSTing payment to the server
    this.saveInProgress = true;

    startAjaxEvent('Wallet_SendConfirm');

    spend({
      ...this.model.toJSON(),
      feeLevel: app.localSettings.get('defaultTransactionFee'),
    }).fail(jqXhr => {
      let reason = jqXhr.responseJSON && jqXhr.responseJSON.reason || '';

      if (reason === 'ERROR_INVALID_ADDRESS') {
        reason = app.polyglot.t('wallet.sendMoney.errorInvalidAddress');
      }

      openSimpleMessage(app.polyglot.t('wallet.sendMoney.sendPaymentFailDialogTitle'), reason);
      endAjaxEvent('Wallet_SendConfirm', {
        errors: reason,
      });
    }).always(() => {
      this.saveInProgress = false;
    })
      .done(() => {
        endAjaxEvent('Wallet_SendConfirm');
        this.clearForm();
      });
  }

  onClickSend(e) {
    const formData = this.getFormData(this.$formFields);
    this.model.set(formData);
    this.model.set({}, { validate: true });

    // render so errors are shown / cleared
    this.render();

    if (!this.model.validationError) {
      recordEvent('Wallet_Send', { coin: this.coinType });
      this.sendConfirmBox.setState({ show: true });
      this.fetchFeeEstimate();
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();

    e.stopPropagation();
  }

  onClickClear() {
    this.clearForm();
  }

  focusAddress() {
    if (!this.saveInProgress) this.$addressInput.focus();
  }

  getFormData($formFields = this.$formFields) {
    return super.getFormData($formFields);
  }

  setFormData(data = {}, options = {}) {
    const opts = {
      focusAddressInput: true,
      render: true,
      ...options,
    };

    this.clearForm();
    this.model.set(data);
    if (opts.render) this.render();
    setTimeout(() => {
      if (opts.focusAddressInput) this.focusAddress();
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

  fetchFeeEstimate() {
    const amount = convertCurrency(this.model.get('amount'), this.model.get('currency'),
      this.coinType);
    this.sendConfirmBox.fetchFeeEstimate(amount, this.coinType);
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

  render() {
    super.render();

    const defaultCur = typeof getExchangeRate(app.settings.get('localCurrency')) === 'number' ?
      app.settings.get('localCurrency') : this.coinType;

    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        currencyCode: this.model.get('currency') || defaultCur,
        currencies: this.currencies ||
          getCurrenciesSortedByCode(),
        saveInProgress: this.saveInProgress,
        coinType: this.coinType,
      }));

      this._$addressInput = null;
      this._$formFields = null;
      this._$btnSend = null;

      this.$('#walletSendCurrency').select2();

      const sendConfirmBoxState = this.sendConfirmBox && this.sendConfirmBox.getState();
      if (this.sendConfirmBox) this.sendConfirmBox.remove();

      this.sendConfirmBox = this.createChild(SendConfirmBox, {
        metricsOrigin: 'Wallet',
        initialState: { ...sendConfirmBoxState || {} },
      });
      this.listenTo(this.sendConfirmBox, 'clickSend', this.onClickConfirmSend);
      this.getCachedEl('.js-sendConfirmContainer').html(this.sendConfirmBox.render().el);
    });

    return this;
  }
}
