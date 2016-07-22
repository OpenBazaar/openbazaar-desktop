import loadTemplate from '../../../utils/loadTemplate';
import { View } from 'backbone';
import select2 from 'select2'; // eslint-disable-line no-unused-vars

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
      },
      ...options,
    });

    // temp data. This view will need the user model, the languages, the countries, and the
    // currencies.

    this.userModel = {
      // test data, replace with a real model later
      PaymentDataInQR: true,
      ShowNotifications: true,
      ShowNsfw: true,
      ShippingAddresses: [],
      LocalCurrency: 'USD',
      Country: 'UNITED_STATES',
      Language: 'en-US',
      TermsAndConditions: 'Example terms and conditions.',
      RefundPolicy: 'Example terms and conditions',
      BlockedNodes: [],
      StoreModerators: [],
      SMTPSettings: {
        Notifications: true,
        ServerAddress: 'example server address',
        Username: 'example name',
        Password: 'example password',
        SenderEmail: 'example sender email',
        RecipientEmail: 'example recipient email',
      },
    };

    this.languageList = [
      { code: 'en-US', name: 'English - USA' },
      { code: 'de-DE', name: 'German - Germany' },
      { code: 'es', name: 'Spanish' },
    ];

    this.countryList = [
      { code: 'USA', dataName: 'UNITED_STATES', name: 'United States' },
      { code: 'DZD', dataName: 'ALGERIA', name: 'Algeria' },
    ];

    this.currencyList = [
      { code: 'BTC', name: 'Bitcoin' },
      { code: 'USD', name: 'United States Dollar' },
      { code: 'EUR', name: 'Euro' },
    ];

    this.options = {
      // test data
      languageList: this.languageList,
      countryList: this.countryList,
      currencyList: this.currencyList,
    };

    this.options = Object.assign({}, options, this.userModel, this.options);
  }

  save() {
    console.log('saved general');
    // save the form
  }

  cancel() {
    console.log('cancel general');
    // cancel the form
  }

  render() {
    loadTemplate('modals/settings/settingsGeneral.html', (t) => {
      this.$el.html(t(this.options));
    });

    setTimeout(() => {
      this.$('#settingsLanguageSelect').select2();
      this.$('#settingsCountrySelect').select2();
      this.$('#settingsCurrencySelect').select2();
    }, 0);


    return this;
  }
}

