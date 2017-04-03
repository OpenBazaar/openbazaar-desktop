import { integerToDecimal } from '../utils/currency';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';
import Profile from '../models/profile/Profile';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
  }

  model(attrs, options) {
    if (attrs.type === 'profile') {
      delete attrs.type;
      return new Profile(attrs, options);
    }
    delete attrs.type;
    return new ListingShort(attrs, options);
  }

  parse(response) {
    const parsedResponse = [];
    const results = response.results ? response.results.results : [];
    this.morePages = !!response.results.morePages;
    this.total = response.results.total;

    results.forEach(result => {
      const updatedResult = result.data;
      updatedResult.type = result.type;
      const relationships = result.relationships ? result.relationships : {};

      if (updatedResult.type === 'listing') {
        const vendor = relationships.vendor ? relationships.vendor.data : {};
        if (vendor) {
          vendor.guid = vendor.id;
          delete vendor.id;
        }
        updatedResult.vendor = vendor;
        const priceObj = updatedResult.price || {};
        updatedResult.price.amount =
            integerToDecimal(priceObj.amount, priceObj.currencyCode === 'BTC');
        parsedResponse.push(updatedResult);
      } else if (result.type === 'profile') {
        // only add if the results have a valid peerID
        if (updatedResult.peerID) {
          parsedResponse.push(updatedResult);
        }
      }
    });

    return parsedResponse;
  }
}
