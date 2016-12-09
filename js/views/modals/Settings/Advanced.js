import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options,
    });

    this.settings = app.settings.clone();
    this.localSettings = app.localSettings.clone();

    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toJSON()));
    this.listenTo(this.localSettings, 'sync',
      () => app.localSettings.set(this.localSettings.toJSON()));
  }

  get events() {
    return {
      'click .js-smtpContainer input[type="reset"]': 'resetSMTPFields',
    };
  }

  resetSMTPFields() {
    this.settings.set('smtpSettings',
      this.settings.get('smtpSettings').defaults(), { validate: true });
    this.render();
  }

  getFormData(subset = this.$formFields) {
    return super.getFormData(subset);
  }

  save() {
    this.localSettings.set(this.getFormData(this.$localFields), { validate: true });
    this.settings.set(this.getFormData(), { validate: true });

    if (this.localSettings.validationError || this.settings.validationError) {
      // client side validation failed on one or both models
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      // let's save and monitor both save processes
      const localSave = this.localSettings.save();
      const serverSave = this.settings.save();

      $.when(localSave, serverSave)
        .done(() => {
          // both succeeded!
          this.trigger('saveComplete');
        })
        .fail((...args) => {
          // One has failed, the other may have also failed or may
          // fail or may succeed. It doesn't matter, for our purposed one
          // failure is enough for us to consider the "save" to have failed
          this.trigger('saveComplete', false, true,
          args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
        });
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  render() {
    loadTemplate('modals/settings/advanced.html', (t) => {
      this.$el.html(t({
        errors: this.settings.validationError || {},
        ...this.settings.toJSON(),
        ...this.localSettings.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]').
        not('[data-persistence-location="local"]');
      this.$localFields = this.$('[data-persistence-location="local"]');
    });

    return this;
  }
}
