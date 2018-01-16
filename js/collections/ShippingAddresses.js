import { guid } from '../utils';
import { Collection } from 'backbone';
import ShippingAddress from '../models/settings/ShippingAddress';

export default class extends Collection {
  model(attrs, options) {
    return new ShippingAddress({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
