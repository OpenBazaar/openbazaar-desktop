import { Collection } from 'backbone';
import ListingShort from '../models/listing/ListingShort';
import Profile from '../models/profile/Profile';

export default class extends Collection {
  constructor(models = [], options = {}) {
    super(models, options);
  }

  model(attrs, options) {
    // models may be listings or profiles, use the appropriate one
    if (attrs.type === 'profile') {
      delete attrs.type;
      return new Profile(attrs, options);
    }
    delete attrs.type;
    return new ListingShort(attrs, {
      ...options,
      parse: true,
    });
  }

  parse(response) {
    const parsedResponse = [];
    const resultsParent = response.results || {};
    const results = resultsParent.results || [];
    this.morePages = !!resultsParent.morePages;
    this.total = resultsParent.total || 0;

    results.forEach(result => {
      const updatedResult = result.data;
      updatedResult.type = result.type;
      const relationships = result.relationships || {};

      if (updatedResult.type === 'listing') {
        const vendor = relationships.vendor ? relationships.vendor.data : {};
        if (vendor) {
          vendor.guid = vendor.id;
          delete vendor.id;
        }
        updatedResult.vendor = vendor;
        updatedResult.moderators = relationships.moderators || [];
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
