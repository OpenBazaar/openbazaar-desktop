import _ from 'underscore';
import {
  getCoinDivisibility,
  decimalToInteger,
  getExchangeRate,
} from '../../utils/currency';
import { toStandardNotation } from '../../utils/number';
import Options from '../../collections/purchase/Options';
import BaseModel from '../BaseModel';
import Shipping from './Shipping';
import app from '../../app';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.shippable = options.shippable || false;
    this.isCrypto = options.isCrypto || false;
    // If the inventory is for a crypto listing, be sure to convert it from base units
    // before sending it in.
    this.getInventory = () =>
      _.result(options, 'inventory', 99999999999999);

    if (!['string', 'function'].includes(typeof options.coinType)) {
      throw new Error('Please provide a coinType option as a string or a function ' +
        'that returns a string.');
    }

    this.getCoinType = () =>
      _.result(options, 'coinType');

    if (
      this.isCrypto && (
      !['string', 'function'].includes(typeof options.cryptoAmountCurrency)
    )) {
      throw new Error('For a crypto cur listing a cryptoAmountCurrency option ' +
        'must be provided as a string or a function that returns a string.');
    } else {
      this.getCryptoAmountCurrency = () =>
        _.result(options, 'cryptoAmountCurrency');
    }
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
      const inventory = this.getInventory();
      const quantity = attrs.quantity;

      if (attrs.quantity !== undefined) {
        if (typeof quantity !== 'number') {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeNumeric'));
        } else if (quantity <= 0) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBePositive'));
        } else if (quantity > inventory) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.insufficientInventory', {
            smart_count: inventory,
          }));
        } else {
          try {
            const coinType = this.getCoinType();
            const coinDivisibility = getCoinDivisibility(coinType);
            const cryptoAmountCurrency = this.getCryptoAmountCurrency();

            if (
              decimalToInteger(attrs.quantity, coinDivisibility) < 1
            ) {
              const min = toStandardNotation(1 / (10 ** 8));
              const convertedMin = cryptoAmountCurrency === coinType ?
                min :
                (
                  toStandardNotation(
                    (min / getExchangeRate(cryptoAmountCurrency)) *
                      getExchangeRate(coinType)
                  )
                );

              addError('quantity',
                app.polyglot.t('orderModelErrors.cryptoQuantityTooLow', {
                  cur: cryptoAmountCurrency,
                  amount: convertedMin,
                }));
            }
          } catch (e) {
            console.error('Unable to validate whether the crypto quantity is at or above ' +
              'the minimum.');
            console.error(e);
          }

          // const coinDivisibility = getCoinDivisibility(paymentCoin);

          // console.log(typeof item.quantity);
          // console.log(10 ** coinDivisibility);

          // if (
          //   typeof item.quantity === 'number' &&
          //   10 ** coinDivisibility < 1
          // ) {
          //   addError('quantity',
          //     app.polyglot.t('orderModelErrors.cryptoQuantityTooLow', {
          //       paymentCoin,
          //       amount: 1 / coinDivisibility,
          //     }));
          // }          
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
