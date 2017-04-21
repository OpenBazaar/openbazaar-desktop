import { Collection } from 'backbone';
import Item from '../../models/purchase/item';

export default class extends Collection {
  model(attrs, options) {
    return new Item(attrs, options);
  }

  modelId(attrs) {
    return attrs.listingHash;
  }
}
