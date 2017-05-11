import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!this.model || !(this.model instanceof Order)) {
      throw new Error('Please provide an order model');
    }

    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    this.listenTo(this.model.get('items').at(0), 'change', () => this.render());
    this.listenTo(this.model.get('items').at(0).get('shipping'), 'change', () => this.render());
  }

  className() {
    return 'receipt flexColRows gutterVSm';
  }

  get prices() {
    // create an array of price objects that matches the items in the order
    const prices = [];
    this.model.get('items').forEach((item) => {
      const priceObj = {};
      const sName = item.get('shipping').get('name');
      const sService = item.get('shipping').get('service');
      const sOpt = this.options.listing.get('shippingOptions').findWhere({ name: sName });

      priceObj.price = this.options.listing.get('item').get('price');
      priceObj.sPrice = sOpt ? sOpt.get('services').findWhere({ name: sService }).get('price') : 0;
      prices.push(priceObj);
    });
    return prices;
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        listing: this.options.listing.toJSON(),
        displayCurrency: app.settings.get('localCurrency'),
        prices: this.prices,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
