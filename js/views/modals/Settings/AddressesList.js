// import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { splitIntoRows } from '../../../utils';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddressesList',
      ...options,
    });

    if (!this.collection) {
      throw new Error('Please provide a collection.');
    }
  }

  // getFormData() {
  //   return super.getFormData(this.$formFields);
  // }

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
    loadTemplate('modals/settings/addressesList.html', (t) => {
      this.$el.html(t({
        errors,
        addresses: splitIntoRows(this.collection.toJSON()),
      }));

      // this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}
