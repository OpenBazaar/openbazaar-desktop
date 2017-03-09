import { guid } from '../../utils';
import { Collection } from 'backbone';
import Sku from '../../models/listing/Sku';

export default class extends Collection {
  model(attrs, options) {
    return new Sku({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
