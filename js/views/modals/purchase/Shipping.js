import $ from 'jquery';
import '../../../lib/select2';
import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Listing from '../../../models/listing/Listing';
import ShippingOptions from './ShippingOptions';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }
    this.shippingOptions = this.createChild(ShippingOptions, {
      model: this.model,
    });

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
    this.shippingOptions.countryCode = $(e.target).val();
    this.shippingOptions.render();
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
      this.shippingOptions.countryCode = userAddresses.at(0).get('country');
      this.$('.js-shippingOptionsWrapper').html(this.shippingOptions.render().el);
    }

    return this;
  }
}
