import app from '../../../app';
import bigNumber from 'bignumber.js';
import loadTemplate from '../../../utils/loadTemplate';
import { ensureMainnetCode } from '../../../data/walletCurrencies';
// import {
//   getCoinDivisibility,
//   nativeNumberFormatSupported,
//   defaultCryptoCoinDivisibility,
// } from '../../../utils/currency';
import Order from '../../../models/purchase/Order';
import Listing from '../../../models/listing/Listing';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    super(options);

    const opts = {
      paymentCoin: '',
      showTotalTip: true,
      ...options,
    };

    if (!this.model || !(this.model instanceof Order)) {
      throw new Error('Please provide an order model');
    }

    if (!opts.listing || !(opts.listing instanceof Listing)) {
      throw new Error('Please provide a listing model');
    }

    if (!opts.prices) {
      throw new Error('Please provide the prices array');
    }

    this.options = opts;
    this._coupons = opts.couponObj || [];
    this.listing = opts.listing;
    this.prices = opts.prices;
    this.paymentCoin = opts.paymentCoin;
    this.showTotalTip = opts.showTotalTip;
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

  get paymentCoin() {
    return this._paymentCoin;
  }

  /*
   * Specify the payment coin used for the purchase. If one is not yet available,
   * an empty string can be provided.
   */
  set paymentCoin(coin) {
    let paymentCoin = coin;

    try {
      paymentCoin = ensureMainnetCode(coin);
    } catch (e) {
      // pass
    }

    if (typeof paymentCoin !== 'string') {
      throw new Error('The payment coin must be provided as a string.');
    }

    if (paymentCoin !== this._paymentCoin) {
      this._paymentCoin = paymentCoin;
      this.render();
    }
  }

  get showTotalTip() {
    return this._showTotalTip;
  }

  set showTotalTip(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a bool as a boolean.');
    }

    console.log(`set the tip to ${bool}`);

    if (bool !== this._showTotalTip) {
      console.log('hey ho less go');
      this._showTotalTip = bool;
      this.render();
    }
  }

  updatePrices(prices) {
    this.prices = prices;
    this.render();
  }

  render() {
    loadTemplate('modals/purchase/receipt.html', t => {
      const displayCurrency = app.settings.get('localCurrency');

      this.$el.html(t({
        ...this.model.toJSON(),
        listing: this.listing.toJSON(),
        listingCurrency: this.listing.price.currencyCode,
        coupons: this.coupons,
        displayCurrency,
        paymentCoin: this.paymentCoin,
        showTotalTip: this.showTotalTip,
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

          // let coinDiv;
          // let formattedQuantity;

          // try {
          //   coinDiv = getCoinDivisibility(displayCurrency);
          // } catch (e) {
          //   // pass
          // }

          // if (coinDiv === undefined) coinDiv = defaultCryptoCoinDivisibility;

          // if (nativeNumberFormatSupported(quantity, coinDiv)) {
          //   formattedQuantity = new Intl.NumberFormat(displayCurrency, {
          //     minimumFractionDigits: 0,
          //     maximumFractionDigits: coinDiv,
          //   }).format(quantity.toNumber());
          // } else {
          //   formattedQuantity = quantity.toFormat();
          // }

          return {
            ...priceObj,
            // formattedQuantity,
            quantity,
          };
        }),
        isCrypto: this.listing.isCrypto,
      }));
    });

    return this;
  }
}
