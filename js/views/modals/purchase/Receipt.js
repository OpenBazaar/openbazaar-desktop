import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);

    if (!this.model || !(this.model instanceof Order)) {
      throw new Error('Please provide an order model');
    }

    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.prices) {
      throw new Error('Please provide the prices array');
    }

    this.options = options;
    this._coupons = options.couponObj || [];
    this.listing = options.listing;
    this.prices = options.prices;
  }

  className() {
    return 'receipt flexColRows gutterVSm tx5b';
  }

  get coupons() {
    return this._coupons;
  }

  set coupons(coupons) {
    this._coupons = coupons;
  }

  updatePrices(prices) {
    this.prices = prices;
    this.render();
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        listing: this.listing.toJSON(),
        listingCurrency: this.listing.price.currencyCode,
        coupons: this.coupons,
        displayCurrency: app.settings.get('localCurrency'),
        prices: this.prices,
        isCrypto: this.listing.isCrypto,
      }));
    });

    return this;
  }
}
