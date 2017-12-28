import BaseModel from '../BaseModel';
import app from '../../app';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      name: '',
      company: '',
      addressLineOne: '',
      addressLineTwo: '',
      city: '',
      state: '',
      country: app.settings && app.settings.get('country') || 'UNITED_STATES',
      postalCode: '',
      addressNotes: '',
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
      addError('name', 'Name must be a string.');
    } else if (!attrs.name.length) {
      addError('name', app.polyglot.t('shippingAddressModelErrors.provideName'));
    }

    if (is.not.string(attrs.country)) {
      addError('country', 'Country must be a string.');
    } else if (!attrs.country.length) {
      addError('country', app.polyglot.t('shippingAddressModelErrors.provideCountry'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
