import BaseModel from '../BaseModel';
import app from '../../app';
import Items from '../../collections/purchase/Items';
import { isSupportedWalletCur } from '../../data/walletCurrencies';

export default class extends BaseModel {
  constructor(attrs, options = {}) {
    super(attrs, options);
    this.shippable = options.shippable;
  }

  defaults() {
    return {
      // if the listing is not physical, the address and shipping attributes should be blank
      address: '',
      addressNotes: '',
      alternateContactInfo: '',
      city: '',
      countryCode: '',
      items: new Items(),
      moderator: '',
      paymentCoin: '',
      postalCode: '',
      shipTo: '',
      state: '',
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

    const c = attrs.paymentCoin;
    if (!(c && typeof c === 'string' && isSupportedWalletCur(c))) {
      addError('paymentCoin', app.polyglot.t('orderModelErrors.paymentCoinInvalid'));
    }

    if (this.shippable) {
      if (!attrs.shipTo || typeof attrs.shipTo !== 'string' ||
        !attrs.countryCode || typeof attrs.countryCode !== 'string') {
        addError('shipping', app.polyglot.t('orderModelErrors.missingAddress'));
      }
    }

    if (attrs.moderator && typeof attrs.moderator !== 'string') {
      // This should only happen if there is a developer error.
      addError('moderated', 'The moderator value must be a string.');
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }
}
