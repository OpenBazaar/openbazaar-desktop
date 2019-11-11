import app from '../../app';
import { events as listingEvents, shipsFreeToMe } from './';
import { curDefToDecimal } from '../../utils/currency';
import BaseModel from '../BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      freeShipping: [],
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

  parse(response) {
    const parsedResponse = { ...response };

    parsedResponse.categories = Array.isArray(parsedResponse.categories) ?
      parsedResponse.categories : [];

    const modifier = parsedResponse.modifier || 0;
    let amount = '';
    let currencyCode = '';

    try {
      amount = parsedResponse.contractType === 'CRYPTOCURRENCY' ?
          1 : curDefToDecimal(parsedResponse.price);
    } catch (e) {
      console.error(`Unable to convert the listing price from base units: ${e.message}`);
    }

    try {
      currencyCode = parsedResponse.contractType === 'CRYPTOCURRENCY' ?
        parsedResponse.coinType : parsedResponse.price.currency.code;
    } catch (e) {
      // pass
    }

    parsedResponse.price = {
      amount,
      currencyCode,
      modifier,
    };

    try {
      delete parsedResponse.cryptoCurrencyCode;
      delete parsedResponse.modifier;
    } catch (e) {
      // pass
    }

    if (parsedResponse.contractType === 'CRYPTOCURRENCY') {
      // Commenting out inventory related coded since its not functional (on the server
      // at this time.

      // if (parsedResponse.totalInventoryQuantity >= 0 &&
      //   parsedResponse.coinDivisibility > 0) {
      //   parsedResponse.totalInventoryQuantity =
      //     parsedResponse.totalInventoryQuantity / parsedResponse.coinDivisibility;
      // } else {
      //   // If they're not providing a inventory of 0 or more or a coinDivisibility > 0,
      //   // we won't display the inventory since it's an invalid value or one we can't
      //   // represent properly.
      //   delete parsedResponse.totalInventoryQuantity;
      // }
    }

    return parsedResponse;
  }
}
