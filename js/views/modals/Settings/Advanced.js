import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import $ from 'jquery';

const siblingsToggle = '[data-next-siblings-toggle]';
const siblingsToggleInputs = `${siblingsToggle} input[type="radio"]`;

function getResponseReason(resp) {
  let reason;
  try {
    reason = resp.responseJSON.reason || '';
  } catch (e) {
    reason = '';
  }
  return reason;
}

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
      [`change ${siblingsToggleInputs}`]: 'handleNextSiblingsToggle',
    };
  }

  handleNextSiblingsToggle(event) {
    const t = event.target;
    this.applyNextSiblingsToggle(t, t.value);
  }

  applyNextSiblingsToggle(t, val) {
    const p = $(t).parents(siblingsToggle);
    if (val === 'true') {
      p.addClass('showNextSiblings');
    } else {
      p.removeClass('showNextSiblings');
    }
  }

  getFormData(subset = this.$formFields) {
    return super.getFormData(subset);
  }

  saveServer() {
    const formData = this.getFormData();
    this.settings.set(formData);
    return this.settings.save();
  }

  setAndValidate() {
    this.localSettings.set(this.getFormData(this.$localFields), { validate: true });
    this.settings.set(this.getFormData(), { validate: true });
  }

  startSaving() {
    return {
      local: this.localSetting.save(),
      cloud: this.settings.save(),
    };
  }

  attemptSave({ cloudFail, localFail }) {
    if (this.localSettings.validationError || this.settings.validationError) {
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');
      const saving = this.startSaving();
      saving.local.done(() =>
      saving.cloud.done(() => this.trigger('saveComplete'))   // both succeeded
        .fail(r => this.reportFail(r, cloudFail)))            // cloud failed
        .fail(r => this.reportFail(r, localFail));            // local failed
    }
  }

  showErrors() {
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  saveLocalAndServer() {
    const backupLocalSettings = this.localSettings.toJSON();
    const rollbackLocal = () => this.localSettings.set(backupLocalSettings);

    this.setAndValidate();
    this.attemptSave({ localFail: rollbackLocal });
    this.render();
    this.showErrors();
  }

  reportFail(resp, then) {
    const reason = getResponseReason(resp);
    this.trigger('saveComplete', false, true, reason);
    if (then instanceof Function) then();
  }

  saveLocal() {
    const localData = this.getFormData(this.$localFields);
    this.localSettings.set(localData);
    return this.localSettings.save();
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
        ...this.localSettings.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]').
        not('[data-persistence-location="local"]');
      this.$localFields = this.$('[data-persistence-location="local"]');
      this.$el.find(`${siblingsToggleInputs}:checked`).
        each((_, inp) => this.applyNextSiblingsToggle(inp, inp.value));
    });

    return this;
  }
}
