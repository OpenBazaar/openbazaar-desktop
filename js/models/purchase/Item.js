import BaseModel from '../BaseModel';
import Options from '../../collections/purchase/Options';
import Shipping from './Shipping';
import app from '../../app';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.shippable = options.shippable || false;
    this.isCrypto = options.isCrypto || false;
    this.inventory = options.inventory || (() => 99999999999999);
  }

  defaults() {
    return {
      // the options sub model is optional
      // if the listing is not physical, the shipping sub model should have blank values
      listingHash: '',
      // quantity: 0,
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
      addError('quantity', app.polyglot.t('purchaseItemModelErrors.provideQuantity'));
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
      const inventory = this.inventory();

      if (attrs.quantity !== undefined) {
        if (typeof attrs.quantity !== 'number') {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeNumeric'));
        } else if (attrs.quantity <= 0) {
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBePositive'));
        } else if (typeof inventory === 'number' &&
          attrs.quantity > inventory) {
          // If we have the inventory we'll ensure the quanity does not exceed it. If we don't have
          // the inventory (it errored or hasn't loaded yet), we won't hold up the purchase and
          // we'll rely on the server to do the check.
          addError('quantity', app.polyglot.t('purchaseItemModelErrors.insufficientInventory'));
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
