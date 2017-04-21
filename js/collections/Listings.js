import app from '../app';
import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (!options.guid) {
      throw new Error('Please provide a guid.');
    }

    super(models, options);
    this.guid = options.guid;
  }

  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    let url;

    if (this.guid === app.profile.id) {
      url = app.getServerUrl('ob/listings');
    } else {
      url = app.getServerUrl(`ipns/${this.guid}/listings/index.json`);
    }

    return url;
  }

  /**
   * Returns a list of the aggregate categories from all
   * the listing in the collection.
   */
  get categories() {
    const cats = [];

    this.models.forEach(listing => {
      const categories = listing.get('categories') || []; // this may be returned as null
      categories.forEach(cat => {
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
    });

    return parsedResponse;
  }
}
