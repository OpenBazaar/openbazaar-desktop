import _ from 'underscore';
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

  add(models, options) {
    const origModels = _.isArray(models) ? models : [models];
    const formattedModels = [];

    // loop through provided models and format them correctly
    origModels.forEach((model, index) => {
      if (model.type === 'listing' && model.data) {
        const newModel = model.data;
        const relationships = model.relationships ? model.relationships : {};
        const vendor = relationships.vendor ? model.relationships.vendor.data : {};
        vendor.guid = vendor.id;
        newModel.vendor = vendor;
        formattedModels[index] = newModel;
      } else {
        // assume a non-listing is a node type
        // TODO: add node handling code here to create a userCard model
      }
    });
    console.log(formattedModels);
    return super.add(formattedModels, options);
  }

  parse(response) {
    console.log(response);
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
