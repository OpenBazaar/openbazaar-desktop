import BaseModel from '../BaseModel';
import Options from '../../collections/purchase/Options';
import Shipping from './Shipping';
import app from '../../app';

export default class extends BaseModel {
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

    if (attrs.quantity === 'undefined') {
      addError('quantity', app.polyglot.t('orderModelErrors.mustHaveQuantity'));
    } else if (typeof attrs.quantity !== 'number') {
      addError('quantity', app.polyglot.t('orderModelErrors.quantityMustBeNumber'));
    } else if (attrs.quantity < 1) {
      addError('quantity', app.polyglot.t('orderModelErrors.noItems'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
