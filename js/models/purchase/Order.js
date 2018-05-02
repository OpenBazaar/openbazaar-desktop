import BaseModel from '../BaseModel';
import app from '../../app';
import Items from '../../collections/purchase/Items';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.shippable = options.shippable || false;
    this.moderated = options.moderated || false;
  }

  defaults() {
    return {
      // if the listing is not physical, the address and shipping attributes should be blank
      shipTo: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: '',
      addressNotes: '',
      moderator: '',
      items: new Items(),
      alternateContactInfo: '',
    };
  }

  get nested() {
    return {
      items: Items,
    };
  }

  // this will convert and set an address from the settings
  addAddress(sAddr) {
    if (!sAddr) throw new Error('You must provide a valid address object.');

    const company = sAddr.get('company');
    const shipTo = `${sAddr.get('name')}${company ? `, ${company}` : ''}`;
    const address = `${sAddr.get('addressLineOne')} ${sAddr.get('addressLineTwo')}`;
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
      addError('items', 'At least one item is required.');
    }

    if (this.shippable && !attrs.shipTo && !attrs.countryCode) {
      addError('shipping', app.polyglot.t('orderModelErrors.missingAddress'));
    }

    if (this.moderated && !attrs.moderator && attrs.moderator !== undefined) {
      addError('moderated', app.polyglot.t('orderModelErrors.needsModerator'));
    }

    if (!this.moderated && attrs.moderator) {
      // this should only happen if there is a developer error
      addError('moderated', app.polyglot.t('orderModelErrors.removeModerator'));
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
