import { guid } from '../../utils';
import { Collection } from 'backbone';
import Option from '../../models/listing/Option';

export default class extends Collection {
  model(attrs, options) {
    return new Option({
      _clientID: attrs._clientID || guid(),
      ...attrs,
    }, options);
  }

  modelId(attrs) {
    return attrs._clientID;
  }
}
