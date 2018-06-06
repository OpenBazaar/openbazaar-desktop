import $ from 'jquery';
import _ from 'underscore';
import '../../../lib/select2';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import baseView from '../../baseVw';
import Listing from '../../../models/listing/Listing';
import ShippingOptions from './ShippingOptions';

export default class extends baseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this.validOptions = [];

    this.listenTo(app.settings.get('shippingAddresses'), 'update', (col) => {
      // If all the addresses were deleted, set the selection to blank.
      if (!col.models.length) {
        this.selectedAddress = '';
      } else {
        // If the old selected address doesn't exist any more, select the first address and set the
        // selection to the first valid value.
        const userAddresses = app.settings.get('shippingAddresses');
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
      this.trigger('shippingOptionSelected', opts);
    }
  }

  extractValidOptions() {
    console.log('extract')
    // Any time the address is selected, the options valid for that address need to be extracted.
    this.validOptions = [];

    const extractedOptions = this.model.get('shippingOptions').toJSON().filter((option) =>
      option.regions.includes(this.countryCode) || option.regions.includes('ALL'));

    if (extractedOptions.length) {
      extractedOptions.forEach(option => {
        if (option.type === 'LOCAL_PICKUP') {
          // local pickup options need a service with a name and price
          option.services[0] = { name: app.polyglot.t('purchase.localPickup'), price: 0 };
        }
        option.services = _.sortBy(option.services, 'price');
        option.services.forEach(optionService => {
          this.validOptions.push({
            ...optionService,
            name: option.name,
            service: optionService.name,
          });
        });
      });
    }
  }

  get selectedAddress() {
    return this._selectedAddress;
  }

  set selectedAddress(address) {
    if (this._selectedAddress === address) return;

    // if the selected address has a new country, extract the valid shipping options.
    if (address.get('country') !== this.country) this.extractValidOptions();

    this._selectedAddress = address;

    if (this.validOptions.length) {
      // If the previously selected shipping option is no longer valid, select the first valid
      // shipping option. this.selectionOption only has a name and service, as that's the expected
      // data for the server, the validOptions have additonal data in them.
      const isSelectedValid = this.selectedOption && this.selectedOption.name &&
        !!this.validOptions.filter(option => option.name === this.selectedOption.name &&
          option.service === this.selectedOption.service).length;

      if (!isSelectedValid) {
        this.selectedOption = {
          name: this.validOptions[0].name,
          service: this.validOptions[0].service,
        };
      }
    } else {
      this.selectedOption = { name: '', service: '' };
    }

    if (this.shippingOptions) {
      this.shippingOptions.validOptions = this.validOptions;
      this.shippingOptions.selectedOption = this.selectedOption;
      this.shippingOptions.render();
    }
  }

  get countryCode() {
    return this.selectedAddress ? this.selectedAddress.get('country') : '';
  }

  changeShippingAddress(e) {
    const index = $(e.target).val();
    this.selectedAddress = app.settings.get('shippingAddresses').at(index);
  }

  render() {
    // If no address is selected, set the first address before adding anything to the DOM, so the
    // correct shipping options are extracted, if one is available.
    const userAddresses = app.settings.get('shippingAddresses');
    this.selectedAddress = this.selectedAddress || userAddresses.length ? userAddresses.at(0) : '';

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
    this.listenTo(this.shippingOptions, 'shippingOptionSelected', ((opts) => {
      this.selectedOption = opts;
    }));

    this.$('.js-shippingOptionsWrapper').append(this.shippingOptions.render().el);
    
    return this;
  }
}
