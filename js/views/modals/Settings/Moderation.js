import _ from 'underscore';
import $ from 'jquery';
import 'select2';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import Moderator from '../../../models/profile/Moderator';
import baseVw from '../../baseVw';
import languages from '../../../data/languages';
import { getTranslatedCurrencies } from '../../../data/currencies';

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

    // When this bug is fixed and we're saving via PATCH,
    // the block below could be removed:
    // https://github.com/OpenBazaar/openbazaar-go/issues/314
    this.listenTo(app.profile, 'someChange', () => {
      const profileAttrs = _.omit(app.profile.toJSON(),
        ['moderator', 'modInfo']);
      this.profile.set(profileAttrs);
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
    const formData = this.getFormData();
    this.profile.set(formData);

    const save = this.profile.save();

    // When server bug is fixed, use the block below to save
    // instead of the one above.
    // https://github.com/OpenBazaar/openbazaar-go/issues/314

    // const save = this.profile.save(formData, {
    //   attrs: formData,
    //   type: 'PATCH',
    // });

    if (save) {
      const msg = {
        // msg: app.polyglot.t('settings.generalTab.statusSaving'),
        msg: 'Saving moderation settings...',
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      save.done(() => {
        statusMessage.update({
          // msg: app.polyglot.t('settings.generalTab.statusSaveComplete'),
          msg: 'Moderation settings saved.',
          type: 'confirmed',
        });
      })
      .fail((...args) => {
        const errMsg =
          args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';

        // openSimpleMessage(app.polyglot.t('settings.generalTab.saveErrorAlertTitle'), errMsg);
        openSimpleMessage('Unable to save moderation settings', errMsg);

        statusMessage.update({
          // msg: app.polyglot.t('settings.generalTab.statusSaveFailed'),
          msg: 'Unable to save moderation settings.',
          type: 'warning',
        });
      }).always(() => {
        this.$btnSave.removeClass('processing');
        setTimeout(() => statusMessage.remove(), 3000);
      });
    } else {
      // todo: for debugging purposes. remove this else block when this
      // feature is complete.
      console.log('Client side validation error.');
      console.log(this.profile.validationError);
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
    return this._$feePercetageInput ||
      (this._$feePercentageInput = this.$('.js-feePercentageInput'));
  }

  get $feeFixedInput() {
    return this._$feeFixedInput ||
      (this._$feeFixedInput = this.$('.js-feeFixedInput'));
  }

  render() {
    loadTemplate('modals/settings/moderation.html', (t) => {
      const moderator = this.profile.get('modInfo');


      this.$el.html(t({
        errors: this.profile.validationError || {},
        ...moderator.toJSON(),
        isModerator: this.profile.get('moderator'),
        languageList: languages,
        defaultLanguage: app.settings.get('language'),
        defaultCurrency: app.settings.get('localCurrency'),
        currencyList: this.currencyList,
      }));

      this.$('#moderationLanguageSelect').select2({
        multiple: true,
        tags: true,
      });

      this.$('#moderationFeeType').select2({
        minimumResultsForSearch: Infinity,
      });

      this.$('#moderationCurrency').select2();

      this.$formFields = this.$('select[name], input[name], textarea[name]');
      this._$btnSave = null;
      this._$feePercentageInput = null;
      this._$feeFixedInput = null;
    });

    return this;
  }
}
