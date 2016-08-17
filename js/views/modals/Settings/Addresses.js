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

  // in this tab, save will attempt to add a new address based
  // on the data in the address form
  save() {
    const model = this.addressForm.model;
    const formData = this.addressForm.getFormData();

    model.set(formData);
    model.set(formData, { validate: true });

    this.trigger('saving');

    if (model.validationError) {
      // client side validation failed
      this.trigger('saveComplete', true);
    } else {
      this.settings.get('shippingAddresses')
        .push(model);

      const save = this.settings.save(formData, {
        attrs: formData,
        type: 'PATCH',
      });

      if (!save) {
        // this shouldn't happen - must be a developer error
        this.trigger('saveComplete', true);
        throw new Error('Client side validation failed: ' +
          `${JSON.stringify(this.settings.validationError)}`);
      } else {
        this.trigger('savingToServer');

        save.done(() => {
          this.trigger('saveComplete');
          this.addressForm.model = new ShippingAddress();
          this.addressForm.render();
        }).fail((...args) => {
          this.settings.get('shippingAddresses').remove(model);
          this.trigger('saveComplete', false, true,
            args[0] && args[0].responseJSON && args[0].responseJSON.reason || '');
        });
      }
    }

    // render so errors are shown / cleared
    this.render();

    const $firstFormErr = this.$('.js-formContainer .errorList:first');
    if ($firstFormErr.length) $firstFormErr[0].scrollIntoViewIfNeeded();
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
