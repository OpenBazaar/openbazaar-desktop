import app from '../app';
import { Collection } from 'backbone';
// import ListingShort from '../models/listing/ListingShort';

export default class extends Collection {
  constructor(models = [], options = {}) {
    if (!options.guid) {
      throw new Error('Please provide a guid of the other person in the conversation.');
    }

    super(models, options);
    this.guid = options.guid;
  }

  // model(attrs, options) {
  //   return new ListingShort(attrs, options);
  // }

  url() {
    return app.getServerUrl(`ob/chatmessages/${this.guid}`);
  }

  // parse(response) {
  //   return response;
  // }
}
