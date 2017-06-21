import $ from 'jquery';
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
    this.shippingOptions = this.createChild(ShippingOptions, {
      model: this.model,
    });

    this.listenTo(this.shippingOptions, 'shippingOptionSelected', ((opts) => {
      this.trigger('shippingOptionSelected', opts);
    }));
    this.listenTo(app.settings.get('shippingAddresses'), 'update', () => this.render());
  }

  className() {
    return 'shipping';
  }

  events() {
    return {
      'change #shippingAddress': 'changeShippingAddress',
    };
  }

  changeShippingAddress(e) {
    const index = $(e.target).val();
    this.selectedAddress = app.settings.get('shippingAddresses').at(index);
    const code = this.selectedAddress.get('country');
    // if an address with the same country is chosen, don't re-render the options
    if (code !== this.countryCode) {
      this.countryCode = code;
      this.shippingOptions.countryCode = code;
      this.shippingOptions.render();
    }
  }

  render() {
    const userAddresses = app.settings.get('shippingAddresses');

    loadTemplate('modals/purchase/shipping.html', t => {
      this.$el.html(t({
        userAddresses: userAddresses.toJSON(),
      }));
    });
    this.$('#shippingAddress').select2({
      // disables the search box
      minimumResultsForSearch: Infinity,
    });

    if (userAddresses.length) {
      this.selectedAddress = userAddresses.at(0);
      this.shippingOptions.countryCode = this.selectedAddress.get('country');
      this.$('.js-shippingOptionsWrapper').html(this.shippingOptions.render().el);
    } else {
      this.selectedAddress = null;
    }

    return this;
  }
}
