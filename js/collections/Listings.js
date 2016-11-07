import app from '../app';
import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';

export default class extends Collection {
  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    return app.getServerUrl(`ipns/${app.profile.id}/listings/index.json`);
  }

  /**
   * Returns a list of the aggregate categories from all
   * the listing in the collection.
   */
  get categories() {
    const cats = [];

    this.models.forEach(listing => {
      listing.get('category')
        .forEach(cat => {
          if (cats.indexOf(cat) === -1) cats.push(cat);
        });
    });

    // todo: For now sort will only be accurate for standard ascii
    // characters. In order to properly sort categories with
    // foreign characters, we will need to know what language
    // the listing is in and pass that into localeCompare().
    // https://github.com/OpenBazaar/openbazaar-go/issues/143
    return cats.sort();
  }

  parse(response) {
    const parsedResponse = [];

    response.forEach(listing => {
      const updatedListing = listing;
      const priceObj = updatedListing.price;


      updatedListing.price.amount =
        integerToDecimal(priceObj.amount, priceObj.currencyCode === 'BTC');

      parsedResponse.push(updatedListing);

      // for (let i = 0; i < 500; i++) {
      //   parsedResponse.push(updatedListing);
      // }
    });

    return parsedResponse;
  }
}
