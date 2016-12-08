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

  setAndValidate() {
    this.localSettings.set(this.getFormData(this.$localFields), { validate: true });
    this.settings.set(this.getFormData(), { validate: true });
  }

  startSaving() {
    return {
      local: this.localSettings.save(),
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

  reportFail(resp, then) {
    const reason = getResponseReason(resp);
    this.trigger('saveComplete', false, true, reason);
    if (then instanceof Function) then();
  }

  showErrors() {
    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  saveLocalAndServer() {
    const backupLocalSettings = this.localSettings.toJSON();
    const rollbackLocal = () => { this.localSettings.set(backupLocalSettings); this.localSettings.save(); };

    this.setAndValidate();
    this.attemptSave({ cloudFail: rollbackLocal });
    this.render();
    this.showErrors();
  }

  save() {
    this.saveLocalAndServer();
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
      this.$(`${siblingsToggleInputs}:checked`).
        each((_, inp) => this.applyNextSiblingsToggle(inp, inp.value));
    });

    return this;
  }
}
