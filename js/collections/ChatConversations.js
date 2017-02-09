import app from '../app';
import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';

export default class extends Collection {
  // constructor(models = [], options = {}) {
  //   super(models, options);
  // }

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

  parse() {
    const parsedResponse = [];

    // response.forEach(listing => {
    //   const updatedListing = listing;
    //   const priceObj = updatedListing.price;


    //   updatedListing.price.amount =
    //     integerToDecimal(priceObj.amount, priceObj.currencyCode === 'BTC');

    //   parsedResponse.push(updatedListing);
    // });

    return parsedResponse;
  }
}
