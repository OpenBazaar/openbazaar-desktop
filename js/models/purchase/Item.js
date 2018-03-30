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
      quantity: 0,
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

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!this.isCrypto) {
      if (!Number.isInteger(attrs.quantity)) {
        addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeInteger'));
      } else if (attrs.quantity < 1) {
        addError('quantity', app.polyglot.t('purchaseItemModelErrors.mustHaveQuantity'));
      }
    } else {
      const inventory = this.inventory();

      if (typeof attrs.quantity !== 'number') {
        addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBeNumeric'));
      } else if (attrs.quantity < 0) {
        addError('quantity', app.polyglot.t('purchaseItemModelErrors.quantityMustBePositive'));
      } else if (typeof inventory === 'number' &&
        attrs.quantity > inventory) {
        addError('quantity', app.polyglot.t('purchaseItemModelErrors.insufficientInventory'));
      }
    }

    if (this.shippable && (!attrs.shipping.get('name'))) {
      addError('shipping', app.polyglot.t('purchaseItemModelErrors.missingShippingOption'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
