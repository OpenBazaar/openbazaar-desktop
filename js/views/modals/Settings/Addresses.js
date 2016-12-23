import $ from 'jquery';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import { alert } from '../SimpleMessage';
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
    this.listenTo(this.settings, 'sync', (md, resp, syncOpts) => {
      // Since different tabs are working off different parts of
      // the settings model, to not overwrite each other, we'll only
      // update fields that our tab has changed.
      app.settings.set(syncOpts.attrs);
    });

    this.addressForm = this.createChild(AddressesForm, { model: new ShippingAddress() });

    this.addressList = this.createChild(AddressesList,
      { collection: this.settings.get('shippingAddresses') });
    this.listenTo(this.addressList, 'deleteAddress', this.onDeleteAddress);
  }

  events() {
    return {
      'click .js-addAddress': 'saveNewAddress',
    };
  }

  onDeleteAddress(address) {
    const shippingAddresses = this.settings.get('shippingAddresses');
    const removeIndex = shippingAddresses.indexOf(address);

    shippingAddresses.remove(address);

    const save = this.settings.save({ shippingAddresses: shippingAddresses.toJSON() }, {
      attrs: { shippingAddresses: shippingAddresses.toJSON() },
      type: 'PATCH',
    });

    if (save) {
      const truncatedName = address.get('name').slice(0, 30);

      const msg = {
        msg: app.polyglot.t('settings.addressesTab.statusDeletingAddress',
          { name: `<em>${truncatedName}</em>` }),
        type: 'message',
      };

      const statusMessage = app.statusBar.pushMessage({
        ...msg,
        duration: 9999999999999999,
      });

      save.done(() => {
        statusMessage.update({
          msg: app.polyglot.t('settings.addressesTab.statusDeleteAddressComplete',
            { name: `<em>${truncatedName}</em>` }),
          type: 'confirmed',
        });
      })
      .fail((...args) => {
        // put the address that failed to remove back in
        shippingAddresses.add(address, { at: removeIndex });

        const errMsg = args[0] && args[0].responseJSON &&
          args[0].responseJSON.reason || '';

        alert(
          app.polyglot.t('settings.addressesTab.deleteAddressErrorAlertTitle',
            { name: `<em>${truncatedName}</em>` }),
          errMsg
        );

        statusMessage.update({
          msg: app.polyglot.t('settings.addressesTab.statusDeleteAddressFailed',
            { name: `<em>${truncatedName}</em>` }),
          type: 'warning',
        });
      })
      .always(() => setTimeout(() => statusMessage.remove(), 3000));
    }
  }

  saveNewAddress() {
    const model = this.addressForm.model;
    const formData = this.addressForm.getFormData();

    model.set(formData);
    model.set(formData, { validate: true });

    if (!model.validationError) {
      const shippingAddresses = this.settings.get('shippingAddresses');

      shippingAddresses.push(model);

      const save = this.settings.save({ shippingAddresses: shippingAddresses.toJSON() }, {
        attrs: { shippingAddresses: shippingAddresses.toJSON() },
        type: 'PATCH',
      });

      if (save) {
        const truncatedName = model.get('name').slice(0, 30);

        const msg = {
          msg: app.polyglot.t('settings.addressesTab.statusAddingAddress',
            { name: `<em>${truncatedName}</em>` }),
          type: 'message',
        };

        const statusMessage = app.statusBar.pushMessage({
          ...msg,
          duration: 9999999999999999,
        });

        save.done(() => {
          statusMessage.update({
            msg: app.polyglot.t('settings.addressesTab.statusAddAddressComplete',
              { name: `<em>${truncatedName}</em>` }),
            type: 'confirmed',
          });

          this.addressForm.model = new ShippingAddress();
          this.addressForm.render();
        }).fail((...args) => {
          // remove the address that failed to add
          // todo: can't remove by passing in model instance from above because of some
          // weirdness with _clientID... investigate.
          const modelToRemove = shippingAddresses.findWhere({ name: model.get('name') });
          if (modelToRemove) shippingAddresses.remove(modelToRemove);

          const errMsg = args[0] && args[0].responseJSON && args[0].responseJSON.reason || '';

          alert(
            app.polyglot.t('settings.addressesTab.addAddressErrorAlertTitle',
              { name: `<em>${truncatedName}</em>` }),
            errMsg
          );

          statusMessage.update({
            msg: app.polyglot.t('settings.addressesTab.statusAddAddressFailed',
              { name: `<em>${truncatedName}</em>` }),
            type: 'warning',
          });
        }).always(() => {
          this.$btnAddAddress.removeClass('processing');
          setTimeout(() => statusMessage.remove(), 3000);
        });
      }
    }

    // render so errors are shown / cleared
    this.addressForm.render();
    if (!model.validationError) this.$btnAddAddress.addClass('processing');

    const $firstFormErr = this.$('.js-formContainer .errorList:first');
    if ($firstFormErr.length) $firstFormErr[0].scrollIntoViewIfNeeded();
  }

  get $btnAddAddress() {
    return this._$btnAddAddress || this.$('.js-addAddress');
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

      this._$btnAddAddress = null;
    });

    return this;
  }
}
