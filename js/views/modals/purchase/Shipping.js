import $ from 'jquery';
import _ from 'underscore';
import '../../../lib/select2';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseView from '../../baseVw';
import Listing from '../../../models/listing/Listing';
import ShippingOptions from './ShippingOptions';
import ShippingAddress from '../../../models/settings/ShippingAddress';

export default class extends baseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this.validOptions = [];

    const userAddresses = app.settings.get('shippingAddresses');
    this.selectedAddress = userAddresses.at(0) || '';

    this.listenTo(userAddresses, 'update', col => {
      // If all the addresses were deleted, set the selection to blank.
      if (!col.models.length) {
        this.selectedAddress = '';
      } else {
        // If the old selected address doesn't exist any more, select the first address and set the
        // selection to the first valid value.
        this.selectedAddress = userAddresses.get(this.selectedAddress) ?
          this.selectedAddress : userAddresses.at(0);
      }
      this.render();
    });
  }

  className() {
    return 'shipping';
  }

  events() {
    return {
      'change #shippingAddress': 'changeShippingAddress',
    };
  }

  get selectedOption() {
    return this._selectedOption;
  }

  set selectedOption(opts) {
    if (!_.isEqual(this._selectedOption, opts)) {
      this._selectedOption = opts;
      this.trigger('shippingOptionSelected');
    }
  }

  extractValidOptions(address) {
    // Any time the country is changed, the options valid for that country need to be extracted.
    if (address !== '' && !(address instanceof ShippingAddress)) {
      throw new Error('The address must be blank or an instance of the ShippingAddress model.');
    }

    const validOptions = [];
    const countryCode = address ? address.get('country') : '';

    const extractedOptions = this.model.get('shippingOptions').toJSON().filter(option =>
      option.regions.includes(countryCode) || option.regions.includes('ALL'));

    extractedOptions.forEach(option => {
      if (option.type === 'LOCAL_PICKUP') {
        // local pickup options need a service with a name and price
        option.services[0] = { name: app.polyglot.t('purchase.localPickup'), price: 0 };
      }
      option.services = _.sortBy(option.services, 'price');
      option.services.forEach(optionService => {
        validOptions.push({
          ...optionService,
          name: option.name,
          service: optionService.name,
        });
      });
    });

    return validOptions;
  }

  get selectedAddress() {
    return this._selectedAddress;
  }

  set selectedAddress(address) {
    if (this._selectedAddress && _.isEqual(this._selectedAddress, address)) return;

    let validOptions = [];

    // if the selected address has a new country, extract the valid shipping options.
    if (address && address.get('country') !== this.country) {
      validOptions = this.extractValidOptions(address);
    }

    this._selectedAddress = address;

    if (validOptions.length) {
      // If the previously selected shipping option is no longer valid, select the first valid
      // shipping option. this.selectionOption only has a name and service, as that's the expected
      // data for the server, the validOptions have additional data in them.
      const isSelectedValid = this.selectedOption && this.selectedOption.name &&
        !!validOptions.filter(option => option.name === this.selectedOption.name &&
          option.service === this.selectedOption.service).length;

      if (!isSelectedValid) {
        this.selectedOption = {
          name: validOptions[0].name,
          service: validOptions[0].service,
        };
      }
    } else {
      this.selectedOption = { name: '', service: '' };
    }

    if (this.shippingOptions) {
      this.shippingOptions.validOptions = validOptions;
      this.shippingOptions.selectedOption = this.selectedOption;
      this.shippingOptions.render();
    }

    this.validOptions = validOptions;
  }

  changeShippingAddress(e) {
    const index = $(e.target).val();
    this.selectedAddress = app.settings.get('shippingAddresses').at(index);
  }

  render() {
    const userAddresses = app.settings.get('shippingAddresses');

    const selectedAddressIndex = this.selectedAddress && userAddresses.length ?
      userAddresses.indexOf(this.selectedAddress) : '';

    loadTemplate('modals/purchase/shipping.html', t => {
      this.$el.html(t({
        userAddresses: userAddresses.toJSON(),
        selectedAddressIndex,
      }));
    });
    this.$('#shippingAddress').select2({
      // disables the search box
      minimumResultsForSearch: Infinity,
    });

    if (this.shippingOptions) this.shippingOptions.remove();
    this.shippingOptions = this.createChild(ShippingOptions, {
      model: this.model,
      validOptions: this.validOptions,
      selectedOption: this.selectedOption,
    });
    this.listenTo(this.shippingOptions, 'shippingOptionSelected',
        opts => (this.selectedOption = opts));

    if (userAddresses.length) {
      this.$('.js-shippingOptionsWrapper').append(this.shippingOptions.render().el);
    }

    return this;
  }
}
