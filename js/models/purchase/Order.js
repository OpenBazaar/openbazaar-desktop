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

  validate(attrs) {
    const errObj = this.mergeInNestedErrors({});
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.items.length) {
      addError('item', app.polyglot.t('orderModelErrors.noItems'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
