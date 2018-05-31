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

    // Always select the first address when the view is created.
    this.selectedAddress = app.settings.get('shippingAddresses').length ?
      app.settings.get('shippingAddresses').at(0) : '';

    this.listenTo(app.settings.get('shippingAddresses'), 'update', (col) => {
      // If all the addresses were deleted, set the selections to blank values.
      if (!col.models.length) {
        this.selectedAddress = '';
        this.selectedOption = { name: '', service: '' };
      } else {
        // If the old selected address doesn't exist any more, select the first address and set the
        // selection to a blank value. The shipping options view will set a new option on render.
        const userAddresses = app.settings.get('shippingAddresses');
        this.selectedAddress = userAddresses.get(this.selectedAddress) ?
          this.selectedAddress : userAddresses.at(0);
        this.selectedOption = { name: '', service: '' };
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

  get selectedAddress() {
    return this._selectedAddress;
  }

  set selectedAddress(address) {
    this._selectedAddress = address;
  }

  get countryCode() {
    return this.selectedAddress ? this.selectedAddress.get('country') : '';
  }

  changeShippingAddress(e) {
    const index = $(e.target).val();
    this.selectedAddress = app.settings.get('shippingAddresses').at(index);
    this.shippingOptions.countryCode = this.countryCode;
    this.shippingOptions.render();
  }

  render() {
    const userAddresses = app.settings.get('shippingAddresses');
    const selectedAddressIndex = userAddresses.length ?
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
      countryCode: this.countryCode,
      selectedOption: this.selectedOption,
    });
    this.listenTo(this.shippingOptions, 'shippingOptionSelected', ((opts) => {
      this.selectedOption = opts;
    }));

    this.$('.js-shippingOptionsWrapper').append(this.shippingOptions.render().el);



    return this;
  }
}
