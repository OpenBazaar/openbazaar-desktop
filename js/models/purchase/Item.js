import BaseModel from '../BaseModel';
import Options from '../../collections/purchase/Options';
import Shipping from './Shipping';
import app from '../../app';

export default class extends BaseModel {
  defaults() {
    return {
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

    if (!attrs.quantity || attrs.quantity === 'undefined') {
      addError('quantity', app.polyglot.t('orderModelErrors.mustHaveQuantity'));
    }

    if (typeof attrs.quantity !== 'number') {
      addError('quantity', app.polyglot.t('orderModelErrors.quantityMustBeNumber'));
    }

    if (attrs.quantity < 1) {
      addError('quantity', app.polyglot.t('orderModelErrors.quantityMustBePositive'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
