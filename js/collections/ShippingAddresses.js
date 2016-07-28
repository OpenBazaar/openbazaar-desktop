import { Collection } from 'backbone';
import ShippingAddress from '../models/ShippingAddress';

export default class extends Collection {
  model(attrs, options) {
    return new ShippingAddress(attrs, options);
  }
}
