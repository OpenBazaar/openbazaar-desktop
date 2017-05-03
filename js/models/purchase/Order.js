import BaseModel from '../BaseModel';
import app from '../../app';
import Items from '../../collections/purchase/Items';

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
      items: new Items(),
    };
  }

  get nested() {
    return {
      items: Items,
    };
  }

  addAddress(sAddr) {
    // this will convert and set an address from the settings
    const shipTo = sAddr.get('name');
    const address =
      `${sAddr.get('addressLineOne')} ${sAddr.get('addressLineTwo')} ${sAddr.get('company')}`;
    const city = sAddr.get('city');
    const state = sAddr.get('state');
    const postalCode = sAddr.get('postalCode');
    const countryCode = sAddr.get('country');
    const addressNotes = sAddr.get('addressNotes');
    this.set({ shipTo, address, city, state, postalCode, countryCode, addressNotes });
  }

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.items.length) {
      addError('items.quantity', app.polyglot.t('orderModelErrors.noItems'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
