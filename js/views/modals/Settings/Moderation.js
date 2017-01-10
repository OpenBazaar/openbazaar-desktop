import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import Moderator from '../../../models/profile/Moderator';
import baseVw from '../../baseVw';

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

    this.listenTo(this.profile, 'sync', () => {
      console.log('kitchen to the sinker');
      app.profile.set({
        moderator: this.get('moderator'),
        modInfo: this.profile.get('modInfo').toJSON(),
      });
    });

    console.log('moo time');
    window.moo = this.profile;
  }

  events() {
    return {
      'click .js-save': 'save',
    };
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  save() {
    const formData = this.getFormData();
    this.profile.set(formData);

    console.log('hippo happo');
    window.hippo = formData;

    const save = this.profile.save(formData, {
      attrs: formData,
      // type: 'PATCH',
      // ^ uncomment when server bug is fixed:
      // https://github.com/OpenBazaar/openbazaar-go/issues/314
    });

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

  get $btnSave() {
    return this._$btnSave ||
      (this._$btnSave = this.$('.js-save'));
  }

  render() {
    loadTemplate('modals/settings/moderation.html', (t) => {
      const moderator = this.profile.get('modInfo');

      this.$el.html(t({
        errors: moderator.validationError || {},
        ...moderator.toJSON(),
        isModerator: this.profile.get('moderator'),
      }));

      this.$formFields = this.$('select[name], input[name]');
      this._$btnSave = null;
    });

    return this;
  }
}
