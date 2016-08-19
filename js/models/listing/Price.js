import app from '../../app';
import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      currencyCode: app.settings && app.settings.get('localCurrency') || 'USD',
    };
  }

  // required: amount > 0
  // currencyCode is one of the valid codes from currency module

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', 'who do you think your are?');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
