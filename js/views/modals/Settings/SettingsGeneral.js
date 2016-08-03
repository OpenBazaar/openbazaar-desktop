import app from '../../../app';
import languages from '../../../data/languages';
import loadTemplate from '../../../utils/loadTemplate';
import { View } from 'backbone';
import 'select2';

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
      },
      ...options,
    });

    this.settings = app.settings.clone();
    this.settings.on('sync', () => app.settings.set(this.settings.toJSON()));

    this.countryList = [
      { code: 'USA', dataName: 'UNITED_STATES', name: 'United States' },
      { code: 'DZD', dataName: 'ALGERIA', name: 'Algeria' },
    ];

    this.currencyList = [
      { code: 'BTC', name: 'Bitcoin' },
      { code: 'USD', name: 'United States Dollar' },
      { code: 'EUR', name: 'Euro' },
    ];
  }

  save() {
    // save the form
  }

  render() {
    loadTemplate('modals/settings/settingsGeneral.html', (t) => {
      this.$el.html(t({
        languageList: languages,
        countryList: this.countryList,
        currencyList: this.currencyList,
        ...this.settings.toJSON(),
      }));

      setTimeout(() => {
        this.$('#settingsLanguageSelect').select2();
        this.$('#settingsCountrySelect').select2();
        this.$('#settingsCurrencySelect').select2();
      }, 0);
    });

    return this;
  }
}

