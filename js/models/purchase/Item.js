import _ from 'underscore';
import { isValidNumber } from '../../utils/number';
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

    if (this.isCrypto) {
      this.validateCurrencyAmount(
        {
          amount: attrs.bigQuantity,
          currency: {
            code: this.getCoinType,
            divisibility: this.getCoinDiv,
          },
        },
        addError,
        errObj,
        'bigQuantity',
        {
          translations: {
            required: 'purchaseItemModelErrors.provideCryptoQuantity',
            type: 'purchaseItemModelErrors.cryptoQuantityMustBeNumeric',
            fractionDigitCount: 'purchaseItemModelErrors.fractionTooLow',
            range: 'purchaseItemModelErrors.cryptoQuantityMustBePositive',
          },
        }
      );
    } else {
      if (
        attrs.bigQuantity === null ||
        attrs.bigQuantity === undefined ||
        attrs.bigQuantity === ''
      ) {
        addError('bigQuantity', app.polyglot.t('purchaseItemModelErrors.provideQuantity'));
      } else if (
        !isValidNumber(attrs.bigQuantity) ||
        !attrs.bigQuantity.isInteger()
      ) {
        addError('bigQuantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeInteger'));
      } else if (attrs.bigQuantity.lt(1)) {
        addError('bigQuantity', app.polyglot.t('purchaseItemModelErrors.mustHaveQuantity'));
      }
    }

    if (!this.isCrypto) {
      if (typeof attrs.paymentAddress !== 'undefined') {
        addError('paymentAddress', 'The payment address should only be provide on ' +
          'crypto listings');
      }
    } else {
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
