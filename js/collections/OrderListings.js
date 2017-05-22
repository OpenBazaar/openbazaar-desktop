import { Collection } from 'backbone';
import Listing from '../models/listing/Listing';

export default class extends Collection {
  model(attrs, options) {
    return new Listing(attrs, options);
  }
}
