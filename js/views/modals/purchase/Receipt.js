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
          let coinDiv;
          let formattedQuantity;

          if (
            !(
              priceObj.quantity instanceof bigNumber &&
              !priceObj.quantity.isNaN()
            )
          ) {
            return '';
          }

          try {
            coinDiv = getCoinDivisibility(displayCurrency);
          } catch (e) {
            // pass
          }

          if (coinDiv === undefined) coinDiv = defaultCryptoCoinDivisibility;

          if (nativeNumberFormatSupported(priceObj.quantity, coinDiv)) {
            formattedQuantity = new Intl.NumberFormat(displayCurrency, {
              minimumFractionDigits: 0,
              maximumFractionDigits: coinDiv,
            }).format(priceObj.quantity.toNumber());
          } else {
            formattedQuantity = priceObj.quantity.toFormat();
          }

          return {
            ...priceObj,
            formattedQuantity,
          };
        }),
        isCrypto: this.listing.isCrypto,
      }));
    });

    return this;
  }
}
