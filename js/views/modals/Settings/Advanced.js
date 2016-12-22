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

    this.listenTo(this.localSettings, 'sync',
      () => app.localSettings.set(this.localSettings.toJSON()));

    this.listenTo(this.settings, 'sync', (md, resp, syncOpts) => {
      // Since different tabs are working off different parts of
      // the settings model, to not overwrite each other, we'll only
      // update fields that our tab has changed.
      app.settings.set(syncOpts.attrs);
    });
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

    const serverFormData = this.getFormData();
    this.settings.set(serverFormData, { validate: true });

    if (!this.localSettings.validationError && !this.settings.validationError) {
      const saveDeferred = $.Deferred();
      this.trigger('saving', saveDeferred.promise());

      // let's save and monitor both save processes
      const localSave = this.localSettings.save();
      const serverSave = this.settings.save(serverFormData, {
        attrs: serverFormData,
        type: 'PATCH',
      });

      $.when(localSave, serverSave)
        .done(() => {
          // both succeeded!
          saveDeferred.resolve();
        })
        .fail((...args) => {
          // One has failed, the other may have also failed or may
          // fail or may succeed. It doesn't matter, for our purposed one
          // failure is enough for us to consider the "save" to have failed
          const errMsg = args[0] && args[0].responseJSON &&
            args[0].responseJSON.reason || '';
          saveDeferred.reject(errMsg);
        })
        .always(() => this.$btnSave.removeClass('processing'));
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
      this._$btnSave = null;
    });

    return this;
  }
}
