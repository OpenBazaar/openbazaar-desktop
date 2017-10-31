import $ from 'jquery';
import _ from 'underscore';
import '../../../utils/selectize';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import Moderator from '../../../models/profile/Moderator';
import baseVw from '../../baseVw';
import { getTranslatedLangs } from '../../../data/languages';
import { getTranslatedCurrencies } from '../../../data/currencies';
import { formatPrice } from '../../../utils/currency';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsModeration',
      ...options,
    });

    this.profile = app.profile.clone();

    // Sync our clone with any changes made to the global profile.
    this.listenTo(app.profile, 'someChange',
      (md, opts) => this.profile.set(opts.setAttrs));

    // Sync the global profile with any changes we save via our clone.
    this.listenTo(this.profile, 'sync',
      (md, resp, opts) => app.profile.set(this.profile.toJSON(opts.attrs)));

    if (this.profile.get('moderatorInfo')) {
      this.moderator = this.profile.get('moderatorInfo');
    } else {
      this.moderator = new Moderator({
        languages: [app.localSettings.standardizedTranslatedLang()],
      });
      this.profile.set('moderatorInfo', this.moderator);
    }

    // retrieve the moderation default values
    const profileFee = this.profile.get('moderatorInfo').get('fee');
    this.defaultPercentage = _.result(profileFee, 'defaults', {}).percentage || 0;
    this.defaultAmount = _.result(profileFee.get('fixedFee'), 'defaults', {}).amount || 0;

    this.currencyList = getTranslatedCurrencies();

    this.listenTo(this.profile, 'sync', () => {
      app.profile.set({
        moderator: this.profile.get('moderator'),
        moderatorInfo: this.profile.get('moderatorInfo').toJSON(),
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

    // clear unused values by setting them to the default, if it exists
    if (formData.moderatorInfo.fee.feeType === 'PERCENTAGE') {
      formData.moderatorInfo.fee.fixedFee.amount = this.defaultAmount;
    } else if (formData.moderatorInfo.fee.feeType === 'FIXED') {
      formData.moderatorInfo.fee.percentage = this.defaultPercentage;
    }

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

    if (save) {
      this.$btnSave.addClass('processing');
    } else {
      const $firstErr = this.$('.errorList:first');

      if ($firstErr.length) {
        $firstErr[0].scrollIntoViewIfNeeded();
      } else {
        this.trigger('unrecognizedModelError', this, [this.profile]);
      }
    }
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
      const moderator = this.profile.get('moderatorInfo');

      this.$el.html(t({
        errors: this.profile.validationError || {},
        isModerator: this.profile.get('moderator'),
        languageList: getTranslatedLangs(),
        defaultCurrency: app.settings.get('localCurrency'),
        currencyList: this.currencyList,
        max: {
          description: this.moderator.max.descriptionLength,
          terms: this.moderator.max.termsLength,
        },
        formatPrice,
        ...moderator.toJSON(),
      }));

      this.$('#moderationLanguageSelect').selectize({
        maxItems: null,
        plugins: ['remove_button'],
        valueField: 'code',
        searchField: ['name', 'code'],
        closeAfterSelect: false,
        items: moderator.get('languages'),
        options: getTranslatedLangs(),
        render: {
          option: data => `<div>${data.name}</div>`,
          item: data => `<div>${data.name}</div>`,
        },
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
