import app from '../../app';
import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      currencyCode: app.settings && app.settings.get('localCurrency') || 'USD',
    };
  }

  // todo: validate currencyCode is one of the valid codes from currency module
  validate(attrs) {
    let errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', 'who do you think your are?');
    }

    if (attrs.amount === '') {
      addError('amount', 'Please provide a price.');
    } else if (is.not.number(attrs.amount)) {
      addError('amount', 'Please provide the price amount as a number.');
    } else if (!attrs.amount) {
      addError('amount', 'The price must be greater than 0.');
    }

    errObj = this.mergeInNestedModelErrors(errObj);

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
