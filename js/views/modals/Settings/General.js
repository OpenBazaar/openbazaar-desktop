import _ from 'underscore';
import $ from 'jquery';
import '../../../lib/select2';
import app from '../../../app';
import languages from '../../../data/languages';
import { getTranslatedCountries } from '../../../data/countries';
import { getTranslatedCurrencies } from '../../../data/currencies';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { openSimpleMessage } from '../SimpleMessage';

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

    this.localSettings = app.localSettings.clone();

    this.listenTo(this.localSettings, 'sync',
      () => app.localSettings.set(this.localSettings.toJSON()));

    this.countryList = getTranslatedCountries(app.settings.get('language'));
    this.currencyList = getTranslatedCurrencies(app.settings.get('language'));
  }

  events() {
    return {
      'click .js-save': 'save',
      'change #settingsCurrencySelect': 'onChangeCurrencySelect',
      'click .js-restoreDefaultProvider': 'onClickRestoreDefaultProvider',
    };
  }

  onChangeCurrencySelect(e) {
    if (e.target.value === 'BTC') {
      this.$bitcoinUnitField.removeClass('hide');
    } else {
      this.$bitcoinUnitField.addClass('hide');
    }
  }

  onClickRestoreDefaultProvider() {
    const provider = _.result(this.localSettings, 'defaults',
      { searchProvider: '' })
        .searchProvider || '';
    this.$searchProviderInput.val(provider);
  }

  getFormData(fields = this.$settingsFields) {
    return super.getFormData(fields);
  }

  save() {
    this.localSettings.set(this.getFormData(this.$localSettingsFields));
    this.localSettings.set({}, { validate: true });

    const settingsFormData = this.getFormData();
    this.settings.set(settingsFormData);
    this.settings.set({}, { validate: true });

    if (!this.localSettings.validationError && !this.settings.validationError) {
      const msg = {
        msg: app.polyglot.t('settings.generalTab.statusSaving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      // let's save and monitor both save processes
      const localSave = this.localSettings.save();
      const serverSave = this.settings.save(settingsFormData, {
        attrs: settingsFormData,
        type: 'PATCH',
      });

      $.when(localSave, serverSave)
        .done(() => {
          // both succeeded!
          statusMessage.update({
            msg: app.polyglot.t('settings.generalTab.statusSaveComplete'),
            type: 'confirmed',
          });
        })
        .fail((...args) => {
          // One has failed, the other may have also failed or may
          // fail or may succeed. It doesn't matter, for our purposed one
          // failure is enough for us to consider the "save" to have failed
          const errMsg = args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';

          openSimpleMessage(app.polyglot.t('settings.generalTab.saveErrorAlertTitle'), errMsg);

          statusMessage.update({
            msg: app.polyglot.t('settings.generalTab.statusSaveFailed'),
            type: 'warning',
          });
        })
        .always(() => {
          this.$btnSave.removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
    }

    this.render();
    if (!this.localSettings.validationError && !this.settings.validationError) {
      this.$btnSave.addClass('processing');
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  get $bitcoinUnitField() {
    return this._$bitcoinUnitField ||
      (this._$bitcoinUnitField = this.$('.js-bitcoinUnitField'));
  }

  get $searchProviderInput() {
    return this._$searchProviderInput ||
      (this._$searchProviderInput = this.$('input[name=searchProvider]'));
  }

  get $settingsFields() {
    return this._$settingsFields ||
      (this._$settingsFields =
        this.$('select[name], input[name], textarea[name]')
        .not('[data-persistence-location="local"]'));
  }

  get $localSettingsFields() {
    return this._$localSettingsFields ||
      (this._$localSettingsFields =
        this.$('[data-persistence-location="local"]'));
  }

  render() {
    loadTemplate('modals/settings/general.html', (t) => {
      this.$el.html(t({
        languageList: languages,
        countryList: this.countryList,
        currencyList: this.currencyList,
        errors: {
          ...(this.settings.validationError || {}),
          ...(this.localSettings.validationError || {}),
        },
        ...this.localSettings.toJSON(),
        ...this.settings.toJSON(),
      }));

      this.$('#settingsLanguageSelect').select2();
      this.$('#settingsCountrySelect').select2();
      this.$('#settingsCurrencySelect').select2();

      this._$settingsFields = null;
      this._$localSettingsFields = null;
      this._$btnSave = null;
      this._$bitcoinUnitField = null;
      this._$searchProviderInput = null;
    });

    return this;
  }
}

