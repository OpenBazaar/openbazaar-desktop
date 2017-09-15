import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this._coupons = [];

    if (!this.model || !(this.model instanceof Order)) {
      throw new Error('Please provide an order model');
    }

    if (!options.listing || !(options.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!options.prices) {
      throw new Error('Please provide the prices array');
    }

    this.prices = options.prices;

    this.listenTo(this.model.get('items').at(0), 'change', () => this.render());
    this.listenTo(this.model.get('items').at(0).get('shipping'), 'change', () => this.render());
  }

  className() {
    return 'receipt flexColRows gutterVSm tx5b';
  }

  get coupons() {
    return this._coupons;
  }

  updatePrices(prices) {
    if (prices !== this.prices) {
      this.prices = prices;
      this.render();
    }
  }

  set coupons(hashesAndCodes) {
    // when we implement multiple items, the coupons should go into an array that mirrors the itmes
    // if this is the user's own listing, the listing object only has the codes
    const filteredCoupons = this.options.listing.get('coupons').filter((coupon) =>
    hashesAndCodes.indexOf(coupon.get('hash') || coupon.get('discountCode')) !== -1);
    this._coupons = filteredCoupons.map(coupon => coupon.toJSON());
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        listing: this.options.listing.toJSON(),
        coupons: this.coupons,
        displayCurrency: app.settings.get('localCurrency'),
        prices: this.prices,
      }));
    });

    return this;
  }
}
