import app from '../../app';
import { events as listingEvents, shipsFreeToMe } from './';
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

  parse(response) {
    const parsedResponse = { ...response };

    // if (!window.shillbert) {
    //   parsedResponse.price.currencyCode = 'MILLY';
    //   window.shillbert = true;
    // }

    parsedResponse.categories = Array.isArray(parsedResponse.categories) ?
      parsedResponse.categories : [];

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
