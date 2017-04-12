import BaseModel from './BaseModel';
import _ from 'underscore';
import app from '../app';

export default class extends BaseModel {
  defaults() {
    return {
      shipTo: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: '',
      addressNotes: '',
      moderator: '',
      items: [{
        listingHash: '',
        quantity: 0,
        options: [],
        shipping: {
          name: '',
          service: '',
        },
        memo: '',
        coupons: [],
      }],
    };
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.items.length) {
      attrs.items.forEach((item) => {
        if (!item.quantity || item.quantity === 'undefined') {
          addError('quantity', app.polyglot.t('orderModelErrors.mustHaveQuantity'));
        }

        if (typeof item.quantity !== 'number') {
          addError('quantity', app.polyglot.t('orderModelErrors.quantityMustBeNumber'));
        }
      });
    }

    return undefined;
  }
}
