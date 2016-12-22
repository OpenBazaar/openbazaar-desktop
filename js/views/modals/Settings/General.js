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
    this.listenTo(this.settings, 'sync', (md, resp, syncOpts) => {
      // Since different tabs are working off different parts of
      // the settings model, to not overwrite each other, we'll only
      // update fields that our tab has changed.
      app.settings.set(syncOpts.attrs);
    });

    this.countryList = getTranslatedCountries(app.settings.get('language'));
    this.currencyList = getTranslatedCurrencies(app.settings.get('language'));
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  save() {
    const formData = this.getFormData();

    this.settings.set(formData);

    const save = this.settings.save(formData, {
      attrs: formData,
      type: 'PATCH',
    });

    if (save) {
      const saveDeferred = $.Deferred();
      this.trigger('saving', saveDeferred.promise());

      save.done(() => saveDeferred.resolve())
        .fail((...args) => {
          const errMsg =
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';
          saveDeferred.reject(errMsg);
        });
    }

    // render so errrors are shown / cleared
    this.render();

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
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
      this._$btnSave = null;
    });

    return this;
  }
}

