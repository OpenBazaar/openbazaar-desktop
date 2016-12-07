import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAdvanced',
      ...options,
    });

    this.settings = app.settings.clone();

    this.listenTo(this.settings, 'sync', () => app.settings.set(this.settings.toJSON()));
  }

  getFormData(subset = this.$formFields) {
    return super.getFormData(subset);
  }

  saveServer() {
    const formData = this.getFormData();
    this.settings.set(formData);
    return this.settings.save();
  }

  saveLocal() {
    const localData = this.getFormData(this.$localFields);
    app.localSettings.set(localData);
    return app.localSettings.save();
  }

  reportSave(save) {
    this.trigger('saving');

    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      save
        .done(() => {
          this.trigger('saveComplete');
        })
        .fail((...args) => {
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
        });
    }

    this.render();
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  save() {
    this.reportSave(this.saveLocal() && this.saveServer());
  }

  render() {
    loadTemplate('modals/settings/advanced.html', (t) => {
      this.$el.html(t({
        errors: this.settings.validationError || {},
        ...this.settings.toJSON(),
        ...app.localSettings.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]').
        not('[data-persistence-location="local"]');
      this.$localFields = this.$('[data-persistence-location="local"]');
    });

    return this;
  }
}

