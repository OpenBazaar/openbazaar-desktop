import { Collection } from 'backbone';
import ShippingOption from '../models/listing/ShippingOption';

export default class extends Collection {
  model(attrs, options) {
    return new ShippingOption(attrs, options);
  }
}
