import { guid } from '../../utils';
import { Collection } from 'backbone';
import Coupon from '../../models/listing/Coupon';

export default class extends Collection {
  model(attrs, options) {
    return new Coupon({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
