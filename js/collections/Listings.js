import app from '../app';
import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/ListingShort';

export default class extends Collection {
  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    return app.getServerUrl(`ipns/${app.profile.id}/listings/index.json`);
  }

  parse(response) {
    const parsedResponse = [];

    response.forEach(listing => {
      const updatedListing = listing;
      const priceObj = updatedListing.price;


      updatedListing.price.amount =
        integerToDecimal(priceObj.amount, priceObj.currencyCode === 'BTC');

      parsedResponse.push(updatedListing);
    });

    return parsedResponse;
  }
}
