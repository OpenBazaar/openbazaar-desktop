import $ from 'jquery';
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
    this.profile.on('sync', () => app.profile.set(this.profile.toJSON()));
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
    const deferred = $.Deferred();

    this.profile.set(formData);

    const save = this.profile.save();

    if (!save) {
      // client side validation failed
      deferred.reject();
    } else {
      deferred.notify();
      save.done(() => deferred.resolve())
        .fail((...args) =>
          deferred.reject(args[0] && args[0].responseJSON && args[0].responseJSON.reason || ''));
    }

    // render so errrors are shown / cleared
    this.render();

    return deferred.promise();
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

