import _ from 'underscore';
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

    this.listenTo(this.model.get('items').at(0), 'change', () => this.render());
    this.listenTo(this.model.get('items').at(0).get('shipping'), 'change', () => this.render());
  }

  className() {
    return 'receipt flexColRows gutterVSm tx5b';
  }

  get coupons() {
    return this._coupons;
  }

  set coupons(hashesAndCodes) {
    // when we implement multiple items, the coupons should go into an array that mirrors the itmes
    // if this is the user's own listing, the listing object only has the codes
    const filteredCoupons = this.options.listing.get('coupons').filter((coupon) =>
    hashesAndCodes.indexOf(coupon.get('hash') || coupon.get('discountCode')) !== -1);
    this._coupons = filteredCoupons.map(coupon => coupon.toJSON());
  }

  get prices() {
    // create an array of price objects that matches the items in the order
    const prices = [];
    this.model.get('items').forEach(item => {
      const priceObj = {};
      const shipping = item.get('shipping');
      const sName = shipping.get('name');
      const sService = shipping.get('service');
      const sOpt = this.options.listing.get('shippingOptions').findWhere({ name: sName });
      const sOptService = sOpt ? sOpt.get('services').findWhere({ name: sService }) : '';
      // determine which skus match the chosen options
      const variantCombo = [];
      item.get('options').forEach((option, i) => {
        const variants = this.options.listing.get('item').get('options').at(i)
          .get('variants')
          .toJSON();
        const variantIndex = variants.findIndex(variant => variant.name === option.get('value'));
        variantCombo.push(variantIndex);
      });
      const sku = this.options.listing.get('item').get('skus').find(v =>
        _.isEqual(v.get('variantCombo'), variantCombo));

      priceObj.price = this.options.listing.get('item').get('price');
      priceObj.sPrice = sOptService ? sOptService.get('price') : 0;
      priceObj.vPrice = sku ? sku.get('surcharge') : 0;
      prices.push(priceObj);
    });
    return prices;
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        listing: this.options.listing.toJSON(),
        coupons: this.coupons,
        displayCurrency: app.settings.get('localCurrency'),
        prices: this.prices,
        ...this.model.toJSON(),
      }));
    });

    return this;
  }
}
