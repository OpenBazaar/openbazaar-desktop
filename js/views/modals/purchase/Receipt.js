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

const RECEIPT_TRUNCATE_AFTER_CHARS = 12;

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

  createPriceVw(amount, toCur, options = {}) {
    if (typeof amount !== 'number') {
      throw new Error('Please provide an amount as a number.');
    }

    if (typeof toCur !== 'string') {
      throw new Error('Please provide a tour as a string.');
    }

    return this.createChild(Value, {
      ...options,
      initialState: {
        ...full({
          toCur,
        }),
        amount,
        toCur,
        truncateAfterChars: RECEIPT_TRUNCATE_AFTER_CHARS,
        ...(options && options.initialState),
      },
    });
  }

  render() {
    super.render();

    const flatListing = this.listing.toJSON();
    const listingCurrency = this.listing.price.currencyCode;
    const displayCurrency = app.settings.get('localCurrency');
    const viewingCurrency = exchangeRateAvailable(displayCurrency) ?
      displayCurrency : listingCurrency;
    const isCrypto = this.listing.isCrypto;
    const priceObj = this.prices[0];

    // convert the prices here, to prevent rounding errors in the display
    const basePrice = convertCurrency(priceObj.price, listingCurrency, viewingCurrency);
    const surcharge = convertCurrency(priceObj.vPrice, listingCurrency, viewingCurrency);
    const shippingPrice = convertCurrency(priceObj.sPrice, listingCurrency, viewingCurrency);
    const additionalShippingPrice = convertCurrency(priceObj.aPrice, listingCurrency,
      viewingCurrency);

    let quantity = Number.isInteger(priceObj.quantity) && priceObj.quantity > 0 ?
      priceObj.quantity : 1;

    if (isCrypto) {
      quantity = typeof priceObj.quantity === 'number' && priceObj.quantity > 0 ?
        priceObj.quantity : 0;
    }

    const shippingTotal = shippingPrice + additionalShippingPrice * (quantity - 1);
    let itemTotal = basePrice + surcharge;
    const subTotal = itemTotal * quantity;

    this.coupons.forEach(coupon => {
      if (coupon.percentDiscount) {
        itemTotal -= itemTotal * 0.01 * coupon.percentDiscount;
      } else if (coupon.priceDiscount) {
        itemTotal -= convertCurrency(coupon.priceDiscount, listingCurrency, viewingCurrency);
      }
    });

    loadTemplate('modals/purchase/receipt.html', t => {
      this.$el.html(t({
        ...this.model.toJSON(),
        listing: flatListing,
        listingCurrency,
        coupons: this.coupons,
        displayCurrency,
        prices: this.prices,
        isCrypto: this.listing.isCrypto,
        shippingTotal,
      }));

      if (this.quantity) this.quantity.remove();
      if (this.cryptoQuantity) this.cryptoQuantity.remove();
      if (this.cryptoTotal) this.cryptoTotal.remove();
      if (this.listingPrice) this.listingPrice.remove();
      if (this.shippingPrice) this.shippingPrice.remove();
      if (this.additionalShippingPrice) this.additionalShippingPrice.remove();
      if (this.subTotal) this.subTotal.remove();
      if (this.shippingTotal) this.shippingTotal.remove();
      (this.couponPrices || []).forEach(cp => cp.remove());
      this.couponPrices = [];
      if (this.totalPrice) this.totalPrice.remove();

      if (!isCrypto) {
        if (quantity) {
          swallowException(() => {
            this.quantity = this.createChild(Value, {
              initialState: {
                style: 'decimal',
                minDisplayDecimals: 0,
                maxDisplayDecimals: 0,
                maxDisplayDecimalsOnZero: 0,
                truncateAfterChars: 8,
                amount: quantity,
                fromCur: viewingCurrency,
              },
            });

            this.getCachedEl('.js-quantity')
              .html(this.quantity.render().el);
          });
        }

        swallowException(() => {
          this.listingPrice = this.createPriceVw(
            basePrice,
            viewingCurrency
          );

          this.getCachedEl('.js-listingPrice')
            .html(this.listingPrice.render().el);
        });

        swallowException(() => {
          this.listingPrice = this.createPriceVw(
            basePrice,
            viewingCurrency
          );

          this.getCachedEl('.js-listingPrice')
            .html(this.listingPrice.render().el);
        });

        if (flatListing.shippingOptions && flatListing.shippingOptions.length) {
          swallowException(() => {
            this.shippingPrice = this.createPriceVw(
              shippingPrice,
              viewingCurrency
            );

            this.getCachedEl('.js-shippingPrice')
              .html(this.shippingPrice.render().el);
          });

          if (shippingPrice !== additionalShippingPrice && quantity > 1) {
            swallowException(() => {
              this.additionalShippingPrice = this.createPriceVw(
                additionalShippingPrice,
                viewingCurrency
              );

              this.getCachedEl('.js-additionalShippingPrice')
                .html(this.additionalShippingPrice.render().el);
            });
          }

          if (shippingTotal) {
            this.shippingTotal = this.createPriceVw(
              shippingTotal,
              viewingCurrency
            );

            this.getCachedEl('.js-shippingTotal')
              .html(this.shippingTotal.render().el);
          }
        }

        swallowException(() => {
          this.subTotal = this.createPriceVw(
            subTotal,
            viewingCurrency
          );

          this.getCachedEl('.js-subTotal')
            .html(this.subTotal.render().el);
        });
      } else {
        const cryptoQuantityFullConfig = full({
          toCur: listingCurrency,
        });

        swallowException(() => {
          this.cryptoQuantity = this.createPriceVw(
            quantity,
            listingCurrency,
            {
              initialState: {
                style: 'decimal',
                minDisplayDecimals: quantity > 0 ?
                  cryptoQuantityFullConfig.minDisplayDecimals : 0,
                maxDisplayDecimals: quantity > 0 ?
                  cryptoQuantityFullConfig.maxDisplayDecimals : 0,
              },
            }
          );

          this.getCachedEl('.js-cryptoQuantity')
            .html(this.cryptoQuantity.render().el);
        });

        swallowException(() => {
          this.cryptoTotal = this.createPriceVw(
            subTotal,
            viewingCurrency
          );

          this.getCachedEl('.js-cryptoTotal')
            .html(this.cryptoTotal.render().el);
        });
      }

      this.coupons.forEach(coupon => {
        if (typeof coupon.priceDiscount === 'number') {
          swallowException(() => {
            const couponPrice = this.createChild(Value, {
              initialState: {
                ...full({
                  fromCur: listingCurrency,
                  toCur: viewingCurrency,
                }),
                amount: coupon.priceDiscount,
                fromCur: listingCurrency,
                toCur: viewingCurrency,
                truncateAfterChars: RECEIPT_TRUNCATE_AFTER_CHARS,
              },
            });

            this.getCachedEl(`.js-couponPrice[data-coupon-hash=${coupon.hash}]`)
              .html(couponPrice.render().el);

            this.couponPrices.push(couponPrice);
          });
        }
      });

      this.totalPrice = this.createPriceVw(
        subTotal + shippingTotal,
        viewingCurrency
      );

      this.getCachedEl('.js-totalPrice')
        .html(this.totalPrice.render().el);
    });

    return this;
  }
}
