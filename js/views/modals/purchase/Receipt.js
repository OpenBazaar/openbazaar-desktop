import app from '../../../app';
import loadTemplate from '../../../utils/loadTemplate';
import { swallowException } from '../../../utils';
import {
  exchangeRateAvailable,
  convertCurrency,
} from '../../../utils/currency';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';
import BaseView from '../../baseVw';
import Value from '../../components/value/Value';
import { full } from '../../components/value/valueConfigs';

const RECEIPT_TRUNCATE_AFTER_CHARS = 15;

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
    super.render();

    const listingCurrency = this.listing.price.currencyCode;
    const displayCurrency = app.settings.get('localCurrency');
    const viewingCurrency = exchangeRateAvailable(displayCurrency) ?
      displayCurrency : listingCurrency;
    const isCrypto = this.listing.isCrypto;
    const priceObj = this.prices[0];

    // convert the prices here, to prevent rounding errors in the display
    const basePrice = convertCurrency(priceObj.price, listingCurrency, viewingCurrency);
    const surcharge = convertCurrency(priceObj.vPrice, listingCurrency, viewingCurrency);

    let quantity = Number.isInteger(priceObj.quantity) && priceObj.quantity > 0 ?
      priceObj.quantity : 1;

    if (isCrypto) {
      quantity = typeof priceObj.quantity === 'number' && priceObj.quantity > 0 ?
        priceObj.quantity : 0;
    }

    const itemTotal = basePrice + surcharge;
    const subTotal = itemTotal * quantity;

    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        listing: this.listing.toJSON(),
        listingCurrency,
        coupons: this.coupons,
        displayCurrency,
        prices: this.prices,
        isCrypto: this.listing.isCrypto,
      }));

      if (this.cryptoQuantity) this.cryptoQuantity.remove();
      if (this.cryptoTotal) this.cryptoTotal.remove();

      if (isCrypto) {
        const fullConfig = full({
          fromCur: listingCurrency,
        });

        swallowException(() => {
          this.cryptoQuantity = this.createChild(Value, {
            initialState: {
              ...fullConfig,
              amount: quantity,
              fromCur: listingCurrency,
              style: 'decimal',
              minDisplayDecimals: quantity > 0 ?
                fullConfig.minDisplayDecimals : 0,
              maxDisplayDecimals: quantity > 0 ?
                fullConfig.maxDisplayDecimals : 0,
              truncateAfterChars: RECEIPT_TRUNCATE_AFTER_CHARS,
            },
          });

          this.getCachedEl('.js-cryptoQuantity')
            .html(this.cryptoQuantity.render().el);

          this.cryptoTotal = this.createChild(Value, {
            initialState: {
              ...fullConfig,
              amount: subTotal,
              fromCur: viewingCurrency,
              truncateAfterChars: RECEIPT_TRUNCATE_AFTER_CHARS,
            },
          });

          this.getCachedEl('.js-cryptoTotal')
            .html(this.cryptoTotal.render().el);
        });
      }
    });

    return this;
  }
}
