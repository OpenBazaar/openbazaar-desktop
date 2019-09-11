import _ from 'underscore';
import { decimalPlaces, toStandardNotation } from '../../utils/number';
import { minValueByCoinDiv } from '../../utils/currency';
import BaseModel from '../BaseModel';
import Options from '../../collections/purchase/Options';
import Shipping from './Shipping';
import app from '../../app';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);

    if (typeof options.getCoinDiv !== 'function') {
      throw new Error('Please provide a function that returns the coin divisibility ' +
        ' of the listing');
    }

    this.shippable = options.shippable || false;
    this.isCrypto = options.isCrypto || false;

    if (this.isCrypto && typeof options.getCoinType !== 'function') {
      throw new Error('For crypto listings, please provide a function that returns ' +
        'the coinType.');
    }

    this.getCoinType = options.getCoinType;
    this.getCoinDiv = options.getCoinDiv;

    // If the inventory is for a crypto listing, be sure to convert it from base units
    // before sending it in.
    this.getInventory = () =>
      _.result(options, 'inventory', 99999999999999);
  }

  defaults() {
    return {
      // the options sub model is optional
      // if the listing is not physical, the shipping sub model should have blank values
      listingHash: '',
      options: new Options(),
      shipping: new Shipping(),
      memo: '',
      coupons: [], // just the coupon codes
    };
  }

  get idAttribute() {
    return 'listingHash';
  }

  get nested() {
    return {
      options: Options,
      shipping: Shipping,
    };
  }

  get constraints() {
    return {
      minPaymentAddressLength: 1,
      maxPaymentAddressLength: 256,
    };
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.quantity === undefined) {
      const isCrypto = this.isCrypto ? 'Crypto' : '';
      addError('quantity', app.polyglot.t(`purchaseItemModelErrors.provide${isCrypto}Quantity`));
    }

    if (!this.isCrypto) {
      if (attrs.quantity !== undefined) {
        if (!Number.isInteger(attrs.quantity)) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeInteger'));
        } else if (attrs.quantity < 1) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.mustHaveQuantity'));
        }
      }

      if (typeof attrs.paymentAddress !== 'undefined') {
        addError('paymentAddress', 'The payment address should only be provide on ' +
          'crypto listings');
      }
    } else {
      if (attrs.quantity !== undefined) {
        const inventory = this.getInventory();

        let coinDiv = this.getCoinDiv();
        // temp conversion until server updates to the new format
        // temp conversion until server updates to the new format
        // temp conversion until server updates to the new format
        // temp conversion until server updates to the new format
        coinDiv = coinDiv > 99 ?
          Math.log(coinDiv) / Math.log(10) : coinDiv;

        const minCoinDivPrice = minValueByCoinDiv(coinDiv);

        if (typeof attrs.quantity !== 'number') {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeNumeric'));
        } else if (attrs.quantity <= 0) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBePositive'));
        } else if (attrs.quantity < minCoinDivPrice) {
          addError('quantity',
            app.polyglot.t('purchaseItemModelErrors.cryptoQuantityTooLow', {
              cur: this.getCoinType(),
              min: toStandardNotation(minCoinDivPrice),
            })
          );
        } else if (decimalPlaces(attrs.quantity) > coinDiv) {
          // We're rounding in the view to avoid this error, so it should never be
          // user facing.
          addError('quantity',
            `The quantity has too many decimal places. The maximum is ${coinDiv}.`);
        } else if (typeof inventory === 'number' &&
          attrs.quantity > inventory) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.insufficientInventory', {
            smart_count: inventory,
          }));
        }
      }

      if (typeof attrs.paymentAddress !== 'string' || !attrs.paymentAddress) {
        addError('paymentAddress', app.polyglot.t('purchaseItemModelErrors.providePaymentAddress'));
      } else if (attrs.paymentAddress.length < this.constraints.minPaymentAddressLength ||
        attrs.paymentAddress.length > this.constraints.maxPaymentAddressLength) {
        addError('paymentAddress', app.polyglot.t('purchaseItemModelErrors.paymentAddressLength', {
          min: this.constraints.minPaymentAddressLength,
          max: this.constraints.maxPaymentAddressLength,
        }));
      }
    }

    if (this.shippable && (!attrs.shipping.get('name'))) {
      addError('shipping', app.polyglot.t('purchaseItemModelErrors.missingShippingOption'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
