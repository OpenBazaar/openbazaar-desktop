import { Collection } from 'backbone';
import Service from '../models/listing/Service';

export default class extends Collection {
  model(attrs, options) {
    return new Service(attrs, options);
  }
}
