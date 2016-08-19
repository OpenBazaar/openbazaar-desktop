import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      // slug: 'foo-bar-baz',
      contractType: 'PHYSICAL_GOOD',
      listingType: 'FIXED_PRICE',
      // by default, setting to "never" expire (due to a unix bug, the max is before 2038)
      expiry: (new Date(2037, 12, 31, 0, 0, 0, 0)).toISOString(),
    };
  }

  // required: slug, title, type, visibility, price

  // listing type between 1 and 2 -- use string vals
  // contract type between 1 and 4 -- use string vals

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
