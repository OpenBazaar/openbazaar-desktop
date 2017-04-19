import { guid } from '../../utils';
import { Collection } from 'backbone';
import Variant from '../../models/listing/Variant';

export default class extends Collection {
  model(attrs, options) {
    return new Variant({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
