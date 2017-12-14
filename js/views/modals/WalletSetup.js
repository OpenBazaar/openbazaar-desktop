import { remote } from 'electron';
import openSimpleMessage from './SimpleMessage';
import { getTranslatedCurrencies } from '../../data/cryptoCurrencies';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      removeOnClose: true,
      ...options,
    };

    super(opts);

    if (!this.model) {
      throw new Error('Please provide a server configuration model.');
    }

    this.cryptoCurs = getTranslatedCurrencies();
  }

  className() {
    return `${super.className()} modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-browseZcashBinary': 'onClickBrowseZcashBinary',
      'click .js-navNext': 'onClickNext',
      'change [name=walletCurrency]': 'onWalletCurrencyChange',
      ...super.events(),
    };
  }

  onClickBrowseZcashBinary() {
    remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }, e => {
      this.getCachedEl('.js-inputZcashBinaryPath').val(e[0] || '');
    });
  }

  onClickNext() {
    const formData = this.getFormData(this.$formFields);
    this.model.set({
      ...formData,
    });
    this.model.set({}, { validate: true });

    if (this.model.validationError) {
      this.render();

      if (!this.getCachedEl('.js-errorList').length) {
        // This is a developer error.
        const validationErr = this.model.validationError || {};
        throw new Error('There were one or more errors saving the server configuration' +
          `${Object.keys(validationErr).map(key => `\n- ${validationErr[key]}`)}`);
      }

      return;
    }

    this.model.save().done(() => {
      this.trigger('walletSetupComplete');
      this.close();
    }).fail(() => {
      // since we're saving to localStorage this really shouldn't happen
      openSimpleMessage('Unable to save server configuration');
    });
  }

  onWalletCurrencyChange(e) {
    this.getCachedEl('.js-zcashSection').toggleClass('hide', e.target.value !== 'ZEC');
  }

  render() {
    super.render();
    loadTemplate('modals/walletSetup.html', t => {
      this.$el.html(t({
        cryptoCurs: this.cryptoCurs,
        errors: this.model.validationError || {},
        ...this.model.toJSON(),
      }));
      super.render();
    });

    return this;
  }
}
