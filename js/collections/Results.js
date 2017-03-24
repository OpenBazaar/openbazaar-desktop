import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';
// import UserShort from '../models/UserShort';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
  }

  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  parse(response) {
    const parsedResponse = [];
    const results = response.results ? response.results.results : [];
    this.morePages = !!response.results.morePages;
    this.total = response.results.total;

    results.forEach(result => {
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
