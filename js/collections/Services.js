import { guid } from '../utils';
import { Collection } from 'backbone';
import Service from '../models/listing/Service';

export default class extends Collection {
  model(attrs, options) {
    return new Service({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
