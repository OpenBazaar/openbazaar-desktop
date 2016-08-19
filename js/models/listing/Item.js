import BaseModel from '../BaseModel';
import Price from './Price';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      // slug: 'foo-bar-baz',
      title: '',
    };
  }

  // required: slug, title, type, visibility, price

  nested() {
    return {
      price: Price,
    };
  }

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
