import { Collection } from 'backbone';
import Rating from '../../models/order/orderCompletion/Rating';

export default class extends Collection {
  model(attrs, options) {
    return new Rating(attrs, options);
  }

  parse(response) {
    return response;
  }
}
