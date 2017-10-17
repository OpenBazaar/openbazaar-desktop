import $ from 'jquery';
import '../../../lib/select2';
import app from '../../../app';
import { translationLangs } from '../../../data/languages';
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

    // Sync our clone with any changes made to the global settings model.
    this.listenTo(app.settings, 'someChange',
      (md, opts) => this.settings.set(opts.setAttrs));

    // Sync the global settings model with any changes we save via our clone.
    this.listenTo(this.settings, 'sync', (md, resp, opts) => app.settings.set(opts.attrs));

    this.localSettings = app.localSettings.clone();

    // Sync our clone with any changes made to the global local settings model.
    this.listenTo(this.localSettings, 'sync',
      (md, resp, opts) => app.localSettings.set(this.localSettings.toJSON(opts.attrs)));

    // Sync the global local settings model with any changes we save via our clone.
    this.listenTo(this.localSettings, 'sync',
      (md, resp, opts) => app.localSettings.set(opts.attrs));

    this.countryList = getTranslatedCountries();
    this.currencyList = getTranslatedCurrencies();
  }

  events() {
    return {
      'click .js-save': 'save',
      'change #settingsCurrencySelect': 'onChangeCurrencySelect',
    };
  }

  onChangeCurrencySelect(e) {
    if (e.target.value === 'BTC') {
      this.$bitcoinUnitField.removeClass('hide');
    } else {
      this.$bitcoinUnitField.addClass('hide');
    }
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
    } else {
      const $firstErr = this.$('.errorList:first');

      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        const models = [];
        if (this.localSettings.validationError) models.push(this.localSettings);
        if (this.settings.validationError) models.push(this.settings);
        this.trigger('unrecognizedModelError', this, models);
      }
    }
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  get $bitcoinUnitField() {
    return this._$bitcoinUnitField ||
      (this._$bitcoinUnitField = this.$('.js-bitcoinUnitField'));
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
        languageList: translationLangs,
        countryList: this.countryList,
        currencyList: this.currencyList,
        errors: {
          ...(this.settings.validationError || {}),
          ...(this.localSettings.validationError || {}),
        },
        ...this.localSettings.toJSON(),
        ...this.settings.toJSON(),
        // local lang should be declared after the server model, so the local
        // lang takes precedence over the deprecated server one
        language: this.localSettings.get('language'),
      }));

      this.$('#settingsLanguageSelect').select2();
      this.$('#settingsCountrySelect').select2();
      this.$('#settingsCurrencySelect').select2();

      this._$settingsFields = null;
      this._$localSettingsFields = null;
      this._$btnSave = null;
      this._$bitcoinUnitField = null;
    });

    return this;
  }
}

