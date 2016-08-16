import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import AddressesForm from './AddressesForm';
import AddressesList from './AddressesList';
import ShippingAddress from '../../../models/ShippingAddress';

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsAddresses',
      ...options,
    });

    this.settings = app.settings.clone();
    this.settings.on('sync', () => app.settings.set(this.settings.toJSON()));

    this.addressForm = this.createChild(AddressesForm, { model: new ShippingAddress() });
    this.addressList = this.createChild(AddressesList,
      { collection: this.settings.get('shippingAddresses') });
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

  // in this tab, save will attempt to add a new address based
  // on the data in the address form
  save() {
    const model = this.addressForm.model;

    model.set(this.addressForm.getFormData());
    model.set(this.addressForm.getFormData(), { validate: true });

    console.log('boo');
    window.boo = model;

    this.addressForm.render({
      ...model.validationError,
    });

    const $firstFormErr = this.$('.js-formContainer .errorList:first');
    if ($firstFormErr.length) $firstFormErr[0].scrollIntoViewIfNeeded();

    return $.Deferred();
  }

  render() {
    loadTemplate('modals/settings/addresses.html', (t) => {
      this.$el.html(t({
        errors: {},
        ...this.settings.toJSON(),
      }));

      this.$('.js-formContainer').html(
        this.addressForm.render().el
      );

      this.$('.js-listContainer').html(
        this.addressList.render().el
      );

      // this.$formFields = this.$('select[name], input[name]');
    });

    return this;
  }
}
