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

  get isLocalPickup() {
    const buyerOrder = this.get('buyerOrder');

    if (buyerOrder && buyerOrder.items && buyerOrder.items[0] &&
      buyerOrder.items[0].shippingOption) {
      return buyerOrder.items[0].shippingOption.service === '';
    }

    return false;
  }

  parse(response) {
    return {
      ...response,
      // The parse of the Listing model is expecting the listings to be objects
      // with a key of 'listing' (e.g. listing: { slug: '', ... }, so we'll accomodate.
      vendorListings: response.vendorListings.map(listing => ({ listing })),
    };
  }
}
