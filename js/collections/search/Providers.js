import { Collection } from 'backbone';
import Provider from '../../models/search/Provider';

export default class extends Collection {
  model(attrs, options) {
    return new Provider(attrs, options);
  }
}
