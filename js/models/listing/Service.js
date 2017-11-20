import app from '../../app';
import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      price: '',
      additionalItemPrice: '',
      estimatedDelivery: '',
    };
  }

  get idAttribute() {
    return '_clientID';
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (is.not.string(attrs.name)) {
      addError('name', 'Please provide a name as a string.');
    } else if (!attrs.name) {
      addError('name', app.polyglot.t('serviceModelErrors.provideName'));
    }

    if (is.not.string(attrs.estimatedDelivery)) {
      addError('estimatedDelivery', 'Please provide an estimated delivery time as a string.');
    } else if (!attrs.estimatedDelivery) {
      addError('estimatedDelivery', app.polyglot.t('serviceModelErrors.provideEstDeliveryTime'));
    }

    if (attrs.price === '') {
      addError('price', app.polyglot.t('serviceModelErrors.provideAmount'));
    } else if (is.not.number(attrs.price)) {
      addError('price', app.polyglot.t('serviceModelErrors.provideNumericAmount'));
    } else if (attrs.price < 0) {
      addError('price', app.polyglot.t('serviceModelErrors.provideNonNegativePrice'));
    }

    if (attrs.additionalItemPrice === '') {
      addError('additionalItemPrice', app.polyglot.t('serviceModelErrors.provideAmount'));
    } else if (is.not.number(attrs.additionalItemPrice)) {
      addError('additionalItemPrice', app.polyglot.t('serviceModelErrors.provideNumericAmount'));
    } else if (attrs.additionalItemPrice < 0) {
      addError('additionalItemPrice', app.polyglot.t('serviceModelErrors.provideNonNegativePrice'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
