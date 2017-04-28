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

    this.selectIndex = options.selectIndex || 0;

    this.shippingOptions = this.createChild(ShippingOptions, {
      model: this.model,
    });

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
      (cl, updateOpts) => {
        if (updateOpts.changes.added.length ||
          updateOpts.changes.removed.length) {
          this.render();
        }
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

  changeShippingAddress(e) {
    this.selectIndex = $(e.target).val();
    this.shippingOptions.render();
  }

  render() {
    loadTemplate('modals/purchase/shipping.html', t => {
      this.$el.html(t({
        userAddresses: app.settings.get('shippingAddresses').toJSON(),
        selectIndex: this.selectIndex,
      }));
    });

    this.$('#shippingAddress').select2({
      // disables the search box
      minimumResultsForSearch: Infinity,
    });

    const cCode = app.settings.get('shippingAddresses').at(this.selectIndex).get('country');
    this.shippingOptions.countryCode = cCode;

    if (app.settings.get('shippingAddresses').length) {
      this.$('.js-shippingOptionsWrapper').html(this.shippingOptions.render().el);
    }

    return this;
  }
}
