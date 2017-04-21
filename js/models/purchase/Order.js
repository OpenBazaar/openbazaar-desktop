import BaseModel from '../BaseModel';
import app from '../../app';
import Items from '../../collections/purchase/items';

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
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    if (!attrs.items.length) {
      addError('item', app.polyglot.t('orderModelErrors.noItems'));
    }

    if (attrs.items.length) {
      attrs.items.forEach((item) => {
        const quantity = item.get('quantity');

        if (!quantity || quantity === 'undefined') {
          addError('quantity', app.polyglot.t('orderModelErrors.mustHaveQuantity'));
        }

        if (typeof quantity !== 'number') {
          addError('quantity', app.polyglot.t('orderModelErrors.quantityMustBeNumber'));
        }
      });
    }

    return undefined;
  }
}
