import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';
// import UserShort from '../models/UserShort';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (!options.searchURL) {
      throw new Error('Please provide a url for the search provider.');
    }

    super(models, options);
    this.serverPage = options.serverPage || 0;
  }

  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    return this.searchURL;
  }

  parse(response) {
    console.log(response);
    const parsedResponse = [];

    response.forEach(result => {
      const updatedResult = result.data;
      const relationships = result.relationships ? result.relationships : {};
      const vendor = relationships.vendor ? relationships.vendor.data : {};
      if (vendor) {
        vendor.guid = vendor.id;
        delete vendor.id;
      }
      updatedResult.vendor = vendor;
      const priceObj = updatedResult.price;

      updatedResult.price.amount =
          integerToDecimal(priceObj.amount, priceObj.currencyCode === 'BTC');

      parsedResponse.push(updatedResult);
    });

    return parsedResponse;
  }
}
