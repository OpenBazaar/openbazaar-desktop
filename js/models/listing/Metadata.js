import BaseModel from '../BaseModel';
import is from 'is_js';
import { getCurrencyByCode } from '../../data/currencies';

export default class extends BaseModel {
  defaults() {
    return {
      contractType: 'PHYSICAL_GOOD',
      format: 'FIXED_PRICE', // this is not in the design at this time
      // by default, setting to "never" expire (due to a unix bug, the max is before 2038)
      expiry: (new Date(2037, 11, 31, 0, 0, 0, 0)).toISOString(),
    };
  }

  get contractTypes() {
    return [
      'PHYSICAL_GOOD',
      'DIGITAL_GOOD',
      'SERVICE',
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

    const firstDayOf2038 = new Date(2038, 0, 1, 0, 0, 0, 0);

    // please provide data as ISO string (or possibly unix timestamp)
    // todo: validate date is provided in the the right format
    if (is.not.inDateRange(new Date(attrs.expiry), new Date(Date.now()), firstDayOf2038)) {
      addError('expiry', 'The expiration date must be between now and the year 2038.');
    }

    if (!attrs.pricingCurrency || !getCurrencyByCode(attrs.pricingCurrency)) {
      addError('pricingCurrency', 'The currency is not one of the available ones.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
