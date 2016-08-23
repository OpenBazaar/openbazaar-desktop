import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
      },
      ...options,
    });

    this.profile = app.profile.clone();
    this.listenTo(this.profile, 'sync', () => app.profile.set(this.profile.toJSON()));
  }

  getFormData() {
    const formData = super.getFormData(this.$formFields);

    while (formData.handle.startsWith('@')) {
      formData.handle = formData.handle.slice(1);
    }

    ['primaryColor', 'secondaryColor', 'textColor'].forEach((colorField) => {
      if (!formData[colorField].startsWith('#')) {
        formData[colorField] = `#${formData[colorField]}`;
      }
    });

    return formData;
  }

  save() {
    const formData = this.getFormData();

    this.profile.set(formData);

    const save = this.profile.save();

    this.trigger('saving');

    if (!save) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.trigger('savingToServer');

      save.done(() => this.trigger('saveComplete'))
        .fail((...args) =>
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || ''));
    }

    // render so errrors are shown / cleared
    this.render();

    const $firstErr = this.$('.errorList:first');

    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  render(restoreScrollPos = true) {
    let prevScrollPos = 0;
    const $scrollContainer = this.$('.settingsTabFormWrapper');

    if (restoreScrollPos && $scrollContainer.length) {
      prevScrollPos = $scrollContainer[0].scrollTop;
    }

    loadTemplate('modals/settings/page.html', (t) => {
      this.$el.html(t({
        errors: this.profile.validationError || {},
        ...this.profile.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name], textarea[name]');

      if (restoreScrollPos) {
        this.$('.settingsTabFormWrapper')[0].scrollTop = prevScrollPos;
      }
    });

    return this;
  }
}

