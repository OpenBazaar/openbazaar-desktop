import app from '../../../app';
import bigNumber from 'bignumber.js';
import loadTemplate from '../../../utils/loadTemplate';
import {
  getCoinDivisibility,
  nativeNumberFormatSupported,
  defaultCryptoCoinDivisibility,
} from '../../../utils/currency';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';
import BaseView from '../../baseVw';

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
    this.render();
  }

  updatePrices(prices) {
    this.prices = prices;
    this.render();
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      const displayCurrency = app.settings.get('localCurrency');

      console.log('test quants above and below native number threshold support');

      this.$el.html(t({
        ...this.model.toJSON(),
        listing: this.listing.toJSON(),
        listingCurrency: this.listing.price.currencyCode,
        coupons: this.coupons,
        displayCurrency,
        prices: this.prices.map(priceObj => {
          let quantity =
            priceObj.quantity &&
            !priceObj.quantity.isNaN() &&
            priceObj.quantity.gt(0) ?
              priceObj.quantity : bigNumber(1);

          if (this.listing.isCrypto) {
            quantity =
              priceObj.quantity &&
              !priceObj.quantity.isNaN() &&
              priceObj.quantity.gt(0) ?
                priceObj.quantity : bigNumber(0);
          }

          let coinDiv;
          let formattedQuantity;

          try {
            coinDiv = getCoinDivisibility(displayCurrency);
          } catch (e) {
            // pass
          }

          if (coinDiv === undefined) coinDiv = defaultCryptoCoinDivisibility;

          if (nativeNumberFormatSupported(quantity, coinDiv)) {
            formattedQuantity = new Intl.NumberFormat(displayCurrency, {
              minimumFractionDigits: 0,
              maximumFractionDigits: coinDiv,
            }).format(quantity.toNumber());
          } else {
            formattedQuantity = quantity.toFormat();
          }

          return {
            ...priceObj,
            formattedQuantity,
            quantity,
          };
        }),
        isCrypto: this.listing.isCrypto,
      }));
    });

    return this;
  }
}
