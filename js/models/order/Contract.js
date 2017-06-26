import BaseModel from '../BaseModel';
import Listings from '../../collections/order/Listings';

export default class extends BaseModel {
  get nested() {
    return {
      vendorListings: Listings,
    };
  }

  get type() {
    return this.get('vendorListings')
      .at(0)
      .get('metadata')
      .get('contractType');
  }

  get orderTotal() {
    return 99;
  }

  parse(response) {
    return {
      ...response,
      // The parse of the Listing model is expecting the listings to be in objects
      // with a key of 'listing' (e.g. listing: { slug: '', ... }, so we'll accomodate.
      vendorListings: response.vendorListings.map(listing => ({ listing })),
    };
  }
}
