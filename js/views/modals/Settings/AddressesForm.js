// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddressesForm',
      ...options,
    });

    if (!this.model) {
      throw new Error('Please provide a model.');
    }
  }

  getFormData() {
    return super.getFormData(this.$formFields);
  }

  // save() {
  //   const formData = this.getFormData();
  //   const deferred = $.Deferred();

  //   this.settings.set(formData);

  //   const save = this.settings.save(formData, {
  //     attrs: formData,
  //     type: 'PATCH',
  //   });

  //   if (!save) {
  //     // client side validation failed
  //     deferred.reject();
  //   } else {
  //     deferred.notify();
  //     save.done(() => deferred.resolve())
  //       .fail((...args) =>
  //         deferred.reject(args[0] && args[0].responseJSON && args[0].responseJSON.reason || ''));
  //   }

  //   // render so errrors are shown / cleared
  //   this.render();

  //   return deferred.promise();
  // }

  render(errors = {}) {
    loadTemplate('modals/settings/addressesForm.html', (t) => {
      this.$el.html(t({
        errors,
        ...this.model.toJSON(),
      }));

      this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}
