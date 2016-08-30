import BaseModel from '../BaseModel';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      contractType: 'PHYSICAL_GOOD',
      listingType: 'FIXED_PRICE', // this is not in the design at this time
      // by default, setting to "never" expire (due to a unix bug, the max is before 2038)
      expiry: (new Date(2037, 12, 31, 0, 0, 0, 0)).toISOString(),
    };
  }

  get contractTypes() {
    return [
      'PHYSICAL_GOOD',
      'DIGITAL_GOOD',
      'SERVICE',
      'CROWD_FUND',
    ];
  }

  // todo: validate the listing type is one of the available types
  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (this.contractTypes.indexOf(attrs.contractType) === -1) {
      addError('contractType', 'The contract type is not one of the available types.');
    }

    const lastDayOf2037 = new Date(2037, 12, 31, 0, 0, 0, 0);

    if (is.not.number(attrs.expiry)) {
      addError('expiry', 'The expiration date must be provided as a unix timestamp.');
    } else if (is.not.inDateRange(new Date(attrs.expiry), Date.now(), lastDayOf2037)) {
      addError('expiry', 'The expiration date must be between now and the year 2038.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
