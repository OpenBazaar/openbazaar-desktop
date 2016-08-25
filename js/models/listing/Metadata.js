import BaseModel from '../BaseModel';
// import is from 'is_js';

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
  // expiry less than 2038

  get contractTypes() {
    return [
      {
        code: 'PHYSICAL_GOOD',
        name: 'Physical Listing',
      }, {
        code: 'DIGITAL_GOOD',
        name: 'Digital Listing',
      }, {
        code: 'SERVICE',
        name: 'Service',
      }, {
        code: 'CROWD_FUND',
        name: 'Crowd Funded',
      },
    ];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const contractTypeCodes = this.contractTypes.map((contractType) => contractType.code);

    if (contractTypeCodes.indexOf(attrs.contractType) === -1) {
      addError('contractType', 'The contract type is not one of the available types.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
