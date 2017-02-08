import $ from 'jquery';
import '../../../lib/select2';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import Moderator from '../../../models/profile/Moderator';
import baseVw from '../../baseVw';
import languages from '../../../data/languages';
import { getTranslatedCurrencies } from '../../../data/currencies';
import { formatPrice } from '../../../utils/currency';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsModeration',
      ...options,
    });

    this.profile = app.profile.clone();

    if (this.profile.get('modInfo')) {
      this.moderator = this.profile.get('modInfo');
    } else {
      this.moderator = new Moderator();
      this.profile.set('modInfo', this.moderator);
    }

    this.currencyList = getTranslatedCurrencies(app.settings.get('language'));

    this.listenTo(this.profile, 'sync', () => {
      app.profile.set({
        moderator: this.profile.get('moderator'),
        modInfo: this.profile.get('modInfo').toJSON(),
      });
    });
  }

  events() {
    return {
      'click .js-save': 'save',
      'change #moderationFeeType': 'changeFeeType',
    };
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  save() {
    /* if the user isn't already a moderator, the status is true, and the confirmation checkboxes
     aren't checked, show an error */

    const confirmChecked = this.$understandRequirements.prop('checked') &&
      this.$acceptGuidelines.prop('checked');

    if (!this.profile.get('moderator') &&
    this.$('input[name=moderator]:checked').val() === 'true' && !confirmChecked) {
      this.$moderationConfirmError.removeClass('hide');
      return;
    }

    const formData = this.getFormData();

    const profileFee = this.profile.get('modInfo').get('fee');
    const feeDefaults = profileFee.defaults();
    const fixedFeeDefaults = profileFee.get('fixedFee').defaults();

    if (formData.modInfo.fee.feeType === 'PERCENTAGE') {
      if (fixedFeeDefaults) {
        formData.modInfo.fee.fixedFee.amount = fixedFeeDefaults.amount;
      } else {
        // if there is no default, remove the attribute
        delete formData.modInfo.fee.fixedFee.amount;
        this.profile.get('modInfo').get('fee').get('fixedFee')
          .unset('amount');
      }
    } else if (formData.modInfo.fee.feeType === 'FIXED') {
      if (feeDefaults) {
        formData.modInfo.fee.percentage = feeDefaults.percentage;
      } else {
        // if there is no default, remove the attribute
        delete formData.modInfo.fee.percentage;
        this.profile.get('modInfo').get('fee')
          .unset('percentage');
      }
    }

    console.log(formData);

    this.profile.set(formData);

    const save = this.profile.save(formData, {
      attrs: formData,
      type: 'PATCH',
    });

    if (save) {
      const msg = {
        msg: app.polyglot.t('settings.moderationTab.status.saving'),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      save.done(() => {
        statusMessage.update({
          msg: app.polyglot.t('settings.moderationTab.status.done'),
          type: 'confirmed',
        });
      })
      .fail((...args) => {
        const errMsg =
          args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';

        openSimpleMessage(app.polyglot.t('settings.moderationTab.errors.save'), errMsg);

        statusMessage.update({
          msg: app.polyglot.t('settings.moderationTab.status.fail'),
          type: 'warning',
        });
      }).always(() => {
        this.$btnSave.removeClass('processing');
        setTimeout(() => statusMessage.remove(), 3000);
      });
    }

    // render so errrors are shown / cleared
    this.render();

    if (save) this.$btnSave.addClass('processing');

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  changeFeeType(e) {
    const feeType = $(e.target).val();

    this.$feePercentageInput.toggleClass('visuallyHidden', feeType === 'FIXED');
    this.$feeFixedInput.toggleClass('visuallyHidden', feeType === 'PERCENTAGE');
  }

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  get $feePercentageInput() {
    return this._$feePercentageInput ||
      (this._$feePercentageInput = this.$('.js-feePercentageInput'));
  }

  get $feeFixedInput() {
    return this._$feeFixedInput ||
      (this._$feeFixedInput = this.$('.js-feeFixedInput'));
  }

  get $understandRequirements() {
    return this._$understandRequirements ||
      (this._$understandRequirements = this.$('#understandRequirements'));
  }

  get $acceptGuidelines() {
    return this._$acceptGuidelines ||
      (this._$acceptGuidelines = this.$('#acceptGuidelines'));
  }

  get $moderationConfirmError() {
    return this._$moderationConfirmError ||
      (this._$moderationConfirmError = this.$('.js-moderationConfirmError'));
  }

  render() {
    loadTemplate('modals/settings/moderation.html', (t) => {
      const moderator = this.profile.get('modInfo');

      this.$el.html(t({
        errors: this.profile.validationError || {},
        isModerator: this.profile.get('moderator'),
        languageList: languages,
        defaultCurrency: app.settings.get('localCurrency'),
        currencyList: this.currencyList,
        max: {
          description: this.moderator.max.descriptionLength,
          terms: this.moderator.max.termsLength,
        },
        formatPrice,
        ...moderator.toJSON(),
      }));

      this.$('#moderationLanguageSelect').select2({
        multiple: true,
        // do not set tags to true, or the user can add non-existant languages
        dropdownParent: this.$('#moderationLanguageDropdown'),
      });

      this.$('#moderationFeeType').select2({
        minimumResultsForSearch: Infinity,
      });

      this.$('#moderationCurrency').select2();

      this.$formFields = this.$('select[name], input[name], textarea[name]');
      this._$btnSave = null;
      this._$feePercentageInput = null;
      this._$feeFixedInput = null;
      this._$acceptGuidelines = null;
      this._$understandRequirements = null;
      this._$moderationConfirmError = null;
    });

    return this;
  }
}
