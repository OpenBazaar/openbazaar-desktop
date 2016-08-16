import $ from 'jquery';
import app from '../../../app';
import languages from '../../../data/languages';
import { getTranslatedCountries } from '../../../data/countries';
import { getTranslatedCurrencies } from '../../../data/currencies';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import 'select2';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      ...options,
    });

    this.settings = app.settings.clone();
    this.settings.on('sync', () => app.settings.set(this.settings.toJSON()));

    this.countryList = getTranslatedCountries(app.settings.get('language'));
    this.currencyList = getTranslatedCurrencies(app.settings.get('language'));
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  save() {
    const formData = this.getFormData();
    const deferred = $.Deferred();

    this.settings.set(formData);

    const save = this.settings.save(formData, {
      attrs: formData,
      type: 'PATCH',
    });

    if (!save) {
      // client side validation failed
      deferred.reject();
    } else {
      deferred.notify();
      save.done(() => deferred.resolve())
        .fail((...args) =>
          deferred.reject(args[0] && args[0].responseJSON && args[0].responseJSON.reason || ''));
    }

    // render so errrors are shown / cleared
    this.render();

    return deferred.promise();
  }

  render() {
    loadTemplate('modals/settings/general.html', (t) => {
      this.$el.html(t({
        languageList: languages,
        countryList: this.countryList,
        currencyList: this.currencyList,
        errors: this.settings.validationError || {},
        ...this.settings.toJSON(),
      }));

      this.$('#settingsLanguageSelect').select2();
      this.$('#settingsCountrySelect').select2();
      this.$('#settingsCurrencySelect').select2();

      this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}

