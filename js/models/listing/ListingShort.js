import app from '../../app';
import { events as listingEvents, shipsFreeToMe } from './';
import { integerToDecimal, getCurMeta } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      freeShipping: [],
      vendor: {},
    };
  }

  // Needed so this.destroy() will work, since it's
  // a no-op on new models.
  isNew() {
    return false;
  }

  get shipsFreeToMe() {
    return shipsFreeToMe(this);
  }

  shipsTo(country) {
    if (!country) {
      throw new Error('Please provide a country.');
    }

    return this.get('shipsTo').indexOf(country) !== -1;
  }

  get isCrypto() {
    return this.get('contractType') === 'CRYPTOCURRENCY';
  }

  parse(response) {
    const parsedResponse = { ...response };

    parsedResponse.categories = Array.isArray(parsedResponse.categories) ?
      parsedResponse.categories : [];

    if (parsedResponse.contractType === 'CRYPTOCURRENCY') {
      const modifier = parsedResponse.price.modifier || 0;

      parsedResponse.price = {
        ...parsedResponse.price,
        amount: 1 + (modifier / 100),
        currencyCode: parsedResponse.coinType,
        modifier,
      };

      if (parsedResponse.totalInventoryQuantity >= 0 &&
        parsedResponse.coinDivisibility > 0) {
        parsedResponse.totalInventoryQuantity =
          parsedResponse.totalInventoryQuantity / parsedResponse.coinDivisibility;
      } else {
        // If they're not providing a inventory of 0 or more or a coinDivisibility > 0,
        // we won't display the inventory since it's an invalid value or one we can't
        // represent properly.
        delete parsedResponse.totalInventoryQuantity;
      }
    } else {
      const priceObj = parsedResponse.price;
      const { isFiat } = getCurMeta(priceObj.currencyCode);
      parsedResponse.price = {
        ...priceObj,
        // amount: integerToDecimal(priceObj.amount, priceObj.currencyCode),
        // todo Temp Code
        // todo Temp Code
        // todo Temp Code
        // todo Temp Code
        amount: integerToDecimal(priceObj.amount, isFiat ? 2 : 8),
      };
    }

    return parsedResponse;
  }

  sync(method, model, options) {
    let returnSync = 'will-set-later';

    if (method === 'delete') {
      options.url = options.url || app.getServerUrl(`ob/listing/${this.get('slug')}`);
    }

    returnSync = super.sync(method, model, options);

    const eventOpts = {
      xhr: returnSync,
      url: options.url,
      slug: this.get('slug'),
    };

    if (method === 'delete') {
      listingEvents.trigger('destroying', this, eventOpts);

      returnSync.done(() => {
        listingEvents.trigger('destroy', this, eventOpts);
      });
    }

    return returnSync;
  }
}
