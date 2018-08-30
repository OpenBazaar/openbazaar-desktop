import app from '../app';
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
    return app.getServerUrl(`ob/listings/${this.guid}`);
  }

  /**
   * Returns a list of the aggregate categories from all of
   * the listings in the collection.
   */
  get categories() {
    // todo: For now sort will only be accurate for standard ascii
    // characters. In order to properly sort categories with
    // foreign characters, we will need to know what language
    // the listing is in and pass that into localeCompare().
    // https://github.com/OpenBazaar/openbazaar-go/issues/143
    return [...new Set([].concat(...this.pluck('categories')).sort())];
  }

  /**
   * Returns a list of the aggregate listing types from all of
   * the listings in the collection.
   */
  get types() {
    return [...new Set([].concat(...this.pluck('contractType')).sort())];
  }
}
