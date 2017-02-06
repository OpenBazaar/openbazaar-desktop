import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      title: '',
    };
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.discountCode) {
      addError('discountCode', app.polyglot.t('couponModelErrors.provideDiscountCode'));
    }

    if (!attrs.percentDiscount && !attrs.priceDiscount) {
      addError('percentDiscount', app.polyglot.t('couponModelErrors.provideDiscountAmount'));
    }

    if (attrs.percentDiscount && attrs.priceDiscount) {
      // This is an internal error. Assuming a reasonable UI, the user should never be able to
      // create such a case.
      addError('percentDiscount', 'Only one of percentDiscount & priceDiscount is allowed.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
