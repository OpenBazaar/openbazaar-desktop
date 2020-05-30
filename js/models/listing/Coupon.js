import app from '../../app';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      title: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  get max() {
    return {
      titleLength: 70,
    };
  }

  validate(attrs) {
    const errObj = {};

    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.title.length > this.max.titleLength) {
      addError('title', `The title cannot exceed ${this.max.titleLength} characters.`);
    }

    if (!attrs.discountCode) {
      addError('discountCode', app.polyglot.t('couponModelErrors.provideDiscountCode'));
    } else {
      // model.collection is not documented and has at least one quirk, but should work
      // for this case (http://stackoverflow.com/a/15962917/632806)
      if (this.collection) {
        const modelsWithCode = this.collection.where({ discountCode: attrs.discountCode });

        // We'll ensure that the discountCode is unique across the collection and put the error on
        // all the dupes (i.e. not the initial occurence)
        if (modelsWithCode.length > 1 && modelsWithCode[0] !== this) {
          addError('discountCode', app.polyglot.t('couponModelErrors.needUniqueDiscountCode'));
        }
      }
    }

    if (
      (
        typeof attrs.percentDiscount !== 'number' &&
        !attrs.percentDiscount
      ) &&
      !attrs.priceDiscount
    ) {
      addError('percentDiscount', app.polyglot.t('couponModelErrors.provideDiscountAmount'));
    } else if (attrs.percentDiscount && attrs.priceDiscount) {
      // This is an internal error. Assuming a reasonable UI, the user should never be able to
      // create such a case.
      addError('percentDiscount', 'Only one of percentDiscount & priceDiscount is allowed.');
    } else if (typeof attrs.percentDiscount !== 'undefined') {
      if (typeof attrs.percentDiscount !== 'number') {
        addError('percentDiscount',
          app.polyglot.t('couponModelErrors.provideNumericDiscountAmount'));
      } else if (attrs.percentDiscount <= 0) {
        addError('percentDiscount', app.polyglot.t('couponModelErrors.percentageLow'));
      } else if (attrs.percentDiscount >= 100) {
        addError('percentDiscount', app.polyglot.t('couponModelErrors.percentageHigh'));
      }
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
