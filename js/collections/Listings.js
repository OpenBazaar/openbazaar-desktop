import app from '../app';
import { Collection } from 'backbone';
import ListingShort from '../models/ListingShort';

export default class extends Collection {
  model(attrs, options) {
    return new ListingShort(attrs, options);
  }

  url() {
    return app.getServerUrl(`ipns/${app.profile.id}/listings/index.json`);
  }
}
